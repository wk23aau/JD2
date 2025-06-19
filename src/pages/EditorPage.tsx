import React, { useState, useCallback, useEffect, startTransition } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import useAuth
import { trackEvent } from '../services/analyticsService';
import { CVData, ThemeOptions, GeminiRequestStatus, AutofillTarget, ExperienceEntry, CVSection, SkillEntry, EducationEntry, TailoredCVUpdate, SectionContentType as SectionGenType } from '../types';
import { INITIAL_CV_DATA, DEFAULT_THEME, PaletteIcon, DocumentTextIcon, DownloadIcon, SparklesIcon, WandSparklesIcon } from '../constants';
import CVPreview from '../components/CVPreview';
import ThemeSelectorPanel from '../components/panels/ThemeSelectorPanel';
import ContentEditorPanel from '../components/panels/ContentEditorPanel';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import { generateCVContent } from '../services/geminiService';

declare var html2pdf: any;

type ActivePanel = 'theme' | 'content';
type InitialInputType = 'title' | 'description';

const EditorPage: React.FC = () => {
  const auth = useAuth(); // Use AuthContext
  const location = useLocation();
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();

  const [cvData, setCVData] = useState<CVData>(INITIAL_CV_DATA);
  const [currentTheme, setCurrentTheme] = useState<ThemeOptions>(DEFAULT_THEME);
  const [activePanel, setActivePanel] = useState<ActivePanel>('content');
  const [geminiStatus, setGeminiStatus] = useState<GeminiRequestStatus>(GeminiRequestStatus.IDLE);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [jobDescriptionForTailoring, setJobDescriptionForTailoring] = useState<string>('');
  const [activeGeminiAction, setActiveGeminiAction] = useState<string | null>(null);
  const [applyDetailedExperienceUpdates, setApplyDetailedExperienceUpdates] = useState<boolean>(true);
  const [currentCvId, setCurrentCvId] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | number | null>('classic');

  // Removed localStorage loading for cvData and theme as they will be fetched from backend or initialized.
  // Job description and applyDetailedExperienceUpdates are UI state, can remain in localStorage or be reset.
  useEffect(() => {
    try {
      const savedJobDescription = localStorage.getItem('geminiJobDescription');
      const savedApplyDetailedUpdates = localStorage.getItem('geminiApplyDetailedUpdates');
      if (savedJobDescription) setJobDescriptionForTailoring(savedJobDescription);
      if (savedApplyDetailedUpdates) setApplyDetailedExperienceUpdates(JSON.parse(savedApplyDetailedUpdates));
    } catch (error) {
      console.error("Failed to load UI state from localStorage:", error);
      setJobDescriptionForTailoring('');
      setApplyDetailedExperienceUpdates(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('geminiJobDescription', jobDescriptionForTailoring);
  }, [jobDescriptionForTailoring]);

  useEffect(() => {
    localStorage.setItem('geminiApplyDetailedUpdates', JSON.stringify(applyDetailedExperienceUpdates));
  }, [applyDetailedExperienceUpdates]);


  const handleCVDataChange = useCallback((newData: CVData) => {
    setCVData(newData);
  }, []);

  const handleThemeChange = useCallback((theme: ThemeOptions) => {
    setCurrentTheme(theme);
  }, []);

  const handleThemeOptionChange = useCallback(<K extends keyof ThemeOptions>(option: K, value: ThemeOptions[K]) => {
    setCurrentTheme(prevTheme => ({ ...prevTheme, [option]: value }));
  }, []);

  const clearGeminiError = useCallback(() => {
    setGeminiError(null);
  }, []);

  const handleInitialCvGeneration = async (inputValue: string, inputType: InitialInputType, templateIdParam?: string | number | null) => {
    if (!auth.token) {
      setGeminiError("Please log in to generate a CV.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      navigate('/login', { state: { from: location } });
      return;
    }
    const actionType = inputType === 'title' ? 'initial_cv_title' : 'initial_cv_jd';
    setActiveGeminiAction(actionType);
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    try {
        const generationMode = inputType === 'title' ? 'initial_cv_from_title' : 'initial_cv_from_job_description';
        const result = await generateCVContent(auth.token, generationMode as SectionGenType, inputValue); // Pass auth.token
        startTransition(() => {
            setCVData(result as CVData);
            // Save the new CV to backend
            fetch('/api/cvs', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`, // Use auth.token
              },
              body: JSON.stringify({
                cv_data: result,
                template_id: templateIdParam || currentTemplateId || 'classic',
                name: (result as CVData).personalInfo.name || 'Untitled CV'
              }),
            })
            .then(response => {
              if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || `Failed to save (HTTP ${response.status})`); });
              }
              return response.json();
            })
            .then(savedCv => {
              console.log('New CV saved to backend:', savedCv);
              if (savedCv && savedCv.id) {
                  setCurrentCvId(savedCv.id);
                  // Navigate to the new CV's URL to reflect its ID in the path
                  navigate(`/editor/${savedCv.id}`, { replace: true });
              }
            })
            .catch(saveError => {
              console.error('Error saving new CV to backend:', saveError);
              setGeminiError(`CV generated but failed to save: ${saveError instanceof Error ? saveError.message : String(saveError)}.`);
            });
            setIsEditorReady(true);
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            setActiveGeminiAction(null);
        });
    } catch (err) {
        console.error("Initial CV generation error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to generate initial CV.";
        setGeminiError(errorMessage);
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
    }
  };

  const handleAutofillRequest = useCallback(async (target: AutofillTarget, promptValue: string, context?: any) => {
    if (!auth.token) {
      setGeminiError("Please log in to use AI features.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      return;
    }
    const fieldKey = context?.generationType === 'new_experience_entry'
        ? `new_experience_entry_${cvData.experience.length}`
        : target.field
            ? `${target.section}-${target.index}-${target.field}`
            : (target.section as string);

    setActiveGeminiAction(fieldKey);
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    const generationType = (context?.generationType as SectionGenType) || null;

    if (!generationType) {
        const errMsg = `Unsupported autofill target or generation type mapping. Target: ${JSON.stringify(target)}`;
        console.error(errMsg);
        setGeminiError(errMsg);
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
        return;
    }

    try {
      const result = await generateCVContent(auth.token, generationType, promptValue, context); // Pass auth.token
      startTransition(() => {
        setCVData(prevCvData => {
          const newCvData = JSON.parse(JSON.stringify(prevCvData));
          if (generationType === 'new_experience_entry' && target.section === 'experience' && target.action === 'add_new_gemini') {
              const newEntry = result as ExperienceEntry;
              newCvData.experience.push({ ...newEntry, id: newEntry.id || crypto.randomUUID() });
          } else if (generationType === 'new_education_entry' && target.section === 'education' && target.action === 'add_new_gemini') {
              const newEntry = result as EducationEntry;
              newCvData.education.push({ ...newEntry, id: newEntry.id || crypto.randomUUID() });
          } else if (target.section === 'summary' && typeof result === 'string') {
            newCvData.summary = result;
          } else if (target.section.startsWith('experience.') && target.field === 'responsibilities' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.experience[target.index]) newCvData.experience[target.index].responsibilities = result as string[];
          } else if (target.section.startsWith('education.') && target.field === 'details' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.education[target.index]) newCvData.education[target.index].details = result as string[];
          } else if (target.section.startsWith('skills.') && target.field === 'skills' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.skills[target.index]) newCvData.skills[target.index].skills = result as string[];
          }
          return newCvData;
        });
        setGeminiStatus(GeminiRequestStatus.SUCCESS);
        setActiveGeminiAction(null);
      });
    } catch (err) {
      console.error("Gemini autofill error:", err);
      setGeminiError(err instanceof Error ? err.message : "An unknown error occurred during content generation.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      setActiveGeminiAction(null);
    }
  }, [cvData.experience.length, auth.token]); // Added auth.token

  const handleTailorCvRequest = useCallback(async (jobDescription: string, currentCvData: CVData, applyDetailedUpdates: boolean) => {
    if (!auth.token) {
      setGeminiError("Please log in to tailor your CV.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      return;
    }
    setActiveGeminiAction('tailor_cv');
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    try {
        const result = await generateCVContent( // Pass auth.token
            auth.token,
            'tailor_cv_to_job_description',
            jobDescription,
            { existingCV: currentCvData, applyDetailedExperienceUpdates: applyDetailedUpdates }
        ) as TailoredCVUpdate;
        startTransition(() => {
            setCVData(prevCvData => { /* ... (rest of the logic remains same) ... */
                const newCvData = JSON.parse(JSON.stringify(prevCvData));
                newCvData.summary = result.updatedSummary;
                newCvData.skills = result.updatedSkills.map(updatedSkill => {
                    const existingSkill = prevCvData.skills.find(s => s.id === updatedSkill.id || s.category === updatedSkill.category);
                    return { ...updatedSkill, id: updatedSkill.id || existingSkill?.id || crypto.randomUUID() };
                });
                result.updatedExperience.forEach(updatedExp => {
                    const expIndex = newCvData.experience.findIndex((exp: ExperienceEntry) => exp.id === updatedExp.id);
                    if (expIndex !== -1) {
                        newCvData.experience[expIndex].responsibilities = updatedExp.responsibilities;
                        if (applyDetailedUpdates && updatedExp.updatedJobTitle && typeof updatedExp.updatedJobTitle === 'string' && updatedExp.updatedJobTitle.trim() !== "") {
                            newCvData.experience[expIndex].jobTitle = updatedExp.updatedJobTitle;
                        }
                    }
                });
                if (applyDetailedUpdates && result.suggestedNewExperienceEntries && result.suggestedNewExperienceEntries.length > 0) {
                    const newEntriesWithIds = result.suggestedNewExperienceEntries.map(entry => ({ ...entry, id: crypto.randomUUID() }));
                    newCvData.experience.push(...newEntriesWithIds);
                }
                return newCvData;
            });
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            setActiveGeminiAction(null);
        });
    } catch (err) {
        console.error("CV Tailoring error:", err);
        setGeminiError(err instanceof Error ? err.message : "Failed to tailor CV.");
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
    }
  }, [auth.token]); // Added auth.token

  const handleSaveCv = async () => {
    if (!auth.token) {
      setGeminiError("Authentication required to save CV.");
      navigate('/login', { state: { from: location } });
      return;
    }
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setActiveGeminiAction('saving_cv');
    setGeminiError(null);

    const cvPayload = {
      cv_data: cvData,
      template_id: currentTemplateId || 'classic',
      name: cvData.personalInfo.name || 'Untitled CV'
    };

    try {
      let response;
      if (currentCvId) { // Update existing CV
        response = await fetch(`/api/cvs/${currentCvId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
          body: JSON.stringify(cvPayload),
        });
      } else { // Create new CV
        response = await fetch('/api/cvs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
          body: JSON.stringify(cvPayload)
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${currentCvId ? 'update' : 'save'} CV (HTTP ${response.status})`);
      }
      const savedCv = await response.json();
      startTransition(() => {
        if (!currentCvId && savedCv.id) {
          setCurrentCvId(savedCv.id);
          navigate(`/editor/${savedCv.id}`, { replace: true }); // Update URL if new CV saved
        }
        // Optionally update cvData if backend modifies it (e.g. updated_at), though often not necessary for cv_data itself
        // setCVData(savedCv.cv_data);
        setGeminiStatus(GeminiRequestStatus.SUCCESS);
        setActiveGeminiAction('save_cv_success');
        setTimeout(() => setActiveGeminiAction(null), 3000);
        console.log(`CV ${currentCvId ? 'updated' : 'saved as new'} with ID:`, savedCv.id);
      });
    } catch (err) {
      console.error(`Error ${currentCvId ? 'updating' : 'saving'} CV:`, err);
      setGeminiError(err instanceof Error ? err.message : "Failed to save CV.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      setActiveGeminiAction(null);
    }
  };

  const handleDownloadPDF = useCallback(() => { /* ... (logic remains same) ... */
    const scaleBeforePdf = currentTheme.previewScale || 1;
    startTransition(() => {
        setIsPdfGenerating(true);
        setCurrentTheme(prev => ({ ...prev, previewScale: 1 }));
    });
    setGeminiError(null);
    setTimeout(() => {
        const element = document.getElementById('cv-content-formatted');
        if (element) {
            trackEvent('download_cv_pdf', { event_category: 'CV Action', event_label: 'PDF Download' });
            const pdfFilename = `CV_${cvData.personalInfo.name.replace(/\s+/g, '_') || 'Resume'}.pdf`;
            const options = { margin: 0, filename: pdfFilename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: currentTheme.backgroundColor === 'white' ? '#FFFFFF' : (tailwindColorToHex(currentTheme.backgroundColor) || '#FFFFFF') }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
            html2pdf().from(element).set(options).save().catch((err: Error) => {
                console.error("PDF generation failed:", err);
                setGeminiError(`Failed to generate PDF: ${err.message}`);
            }).finally(() => {
                startTransition(() => {
                    setCurrentTheme(prev => ({ ...prev, previewScale: scaleBeforePdf }));
                    setIsPdfGenerating(false);
                });
            });
        } else {
            console.error("CV content element not found for PDF generation.");
            setGeminiError("Could not find CV content to generate PDF.");
            startTransition(() => {
                setCurrentTheme(prev => ({ ...prev, previewScale: scaleBeforePdf }));
                setIsPdfGenerating(false);
            });
        }
    }, 250);
  }, [currentTheme.previewScale, cvData.personalInfo.name, currentTheme.backgroundColor]);

  const tailwindColorToHex = (twColor: string): string | null => { /* ... (logic remains same) ... */
    if (twColor.startsWith('gray-')) return '#F9FAFB'; // Example, not exhaustive
    if (twColor === 'white') return '#FFFFFF';
    if (twColor === 'black') return '#000000';
    const colorMap: {[key:string]: string} = { 'slate-50': '#F8FAFC', 'slate-100': '#F1F5F9', 'blue-50': '#EFF6FF', 'blue-600': '#2563EB', };
    return colorMap[twColor] || null;
  };

  useEffect(() => {
    const loadCv = async () => {
      if (!auth.token && cvId) { // Check for token if cvId is present
          console.error("EditorPage: No auth token, cannot load CV from backend.");
          setGeminiError("Authentication required to load this CV. Please log in.");
          setIsEditorReady(true); // Stop loading, show error
          navigate('/login', { state: { from: location } });
          return;
      }

      if (cvId) {
        console.log("EditorPage: Attempting to load CV with id:", cvId);
        setGeminiStatus(GeminiRequestStatus.LOADING); // Use general loading state
        setActiveGeminiAction('loading_cv');
        try {
          const response = await fetch(`/api/cvs/${cvId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` } // Use auth.token
          });
          if (!response.ok) {
            if (response.status === 404) throw new Error(`CV with ID ${cvId} not found.`);
            if (response.status === 401) throw new Error(`Unauthorized to fetch CV ${cvId}. Please log in again.`);
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || `Failed to fetch CV: ${response.statusText}`);
          }
          // Assuming the backend returns the CV object directly with cv_data field
          const data = await response.json();

          startTransition(() => {
            setCVData(data.cv_data || INITIAL_CV_DATA); // Ensure cv_data is the source
            setCurrentCvId(data.id);
            setCurrentTemplateId(data.template_id || 'classic');
            // TODO: Load theme based on template_id or saved theme with CV
            setGeminiStatus(GeminiRequestStatus.IDLE);
            setActiveGeminiAction(null);
            setIsEditorReady(true);
          });
        } catch (err) {
          console.error("Error loading CV:", err);
          setGeminiError(err instanceof Error ? err.message : "Failed to load CV data.");
          setGeminiStatus(GeminiRequestStatus.ERROR);
          setActiveGeminiAction(null);
          setIsEditorReady(true); // Allow UI to render with error
          // navigate('/'); // Optional: redirect on critical load error
        }
      } else if (location.state && (location.state.jobTitle || location.state.jobDescription)) {
        const { jobTitle, jobDescription, selectedTemplateId } = location.state as any;
        if (jobTitle) {
          handleInitialCvGeneration(jobTitle, 'title', selectedTemplateId);
        } else if (jobDescription) {
          handleInitialCvGeneration(jobDescription, 'description', selectedTemplateId);
        }
        navigate(location.pathname, { replace: true, state: {} }); // Clear location state
      } else {
        // No cvId and no specific location state for generation, start fresh or from unsaved local changes (if any)
        // For now, starting fresh as localStorage for CVData is removed.
        // If user is not logged in, they can still use the editor with INITIAL_CV_DATA.
        // Saving will require login.
        console.log("EditorPage: No cvId or generation state. Initializing fresh editor.");
        setCVData(INITIAL_CV_DATA);
        setCurrentTheme(DEFAULT_THEME);
        setCurrentCvId(null);
        setIsEditorReady(true);
      }
    };

    if (auth.isLoading) { // Wait for auth state to be initialized
        setIsEditorReady(false); // Not ready yet
        return;
    }
    loadCv();
  }, [cvId, auth.isLoading, auth.token, navigate, location]); // location.state removed to avoid re-trigger from its own clearing. Added auth.isLoading and auth.token

  if (!isEditorReady || auth.isLoading) { // Check auth.isLoading as well
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner message={activeGeminiAction === 'loading_cv' ? "Loading CV..." : "Initializing Editor..."} />
      </div>
    );
  }

  return ( /* ... (JSX remains largely the same, ensure buttons that require auth are disabled if !auth.isAuthenticated) ... */
    <>
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
      <aside className="w-full lg:w-1/3 lg:max-w-md bg-slate-200 p-1 flex flex-col border-r border-slate-300 lg:h-full overflow-y-auto">
            <nav className="flex mb-2 rounded-md bg-slate-300 p-0.5">
                <button onClick={() => setActivePanel('content')} className={`flex-1 p-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activePanel === 'content' ? `bg-white text-blue-600 shadow-sm` : `text-slate-600 hover:bg-slate-100`}`} aria-pressed={activePanel === 'content'}>
                    <DocumentTextIcon className="w-4 h-4"/> Content
                </button>
                <button onClick={() => setActivePanel('theme')} className={`flex-1 p-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activePanel === 'theme' ? `bg-white text-purple-600 shadow-sm` : `text-slate-600 hover:bg-slate-100`}`} aria-pressed={activePanel === 'theme'}>
                    <PaletteIcon className="w-4 h-4"/> Theme
                </button>
            </nav>
          <div className="p-2 mt-1 mb-2 border-t border-b border-slate-300">
            <label htmlFor="templateSelector" className="block text-sm font-medium text-gray-700 mb-1">CV Template</label>
            <select
              id="templateSelector"
              value={currentTemplateId || 'classic'}
              onChange={(e) => { const newTemplateId = e.target.value; setCurrentTemplateId(newTemplateId); trackEvent('select_template_editor', { event_category: 'Template Selection', event_label: `Template ID: ${newTemplateId} (Editor)` }); }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
            </select>
          </div>
        {isEditorReady && (
          <div className="p-2 mt-2">
            <button
              onClick={handleSaveCv}
              disabled={!auth.isAuthenticated || geminiStatus === GeminiRequestStatus.LOADING || (geminiStatus === GeminiRequestStatus.SUCCESS && activeGeminiAction === 'save_cv_success') }
              title={!auth.isAuthenticated ? "Please log in to save your CV" : "Save CV to Cloud"}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {(geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === 'saving_cv') ? 'Saving...' : (geminiStatus === GeminiRequestStatus.SUCCESS && activeGeminiAction === 'save_cv_success' ? 'Saved!' : 'Save CV to Cloud')}
            </button>
            {!auth.isAuthenticated && <p className="text-xs text-red-500 text-center mt-1">Login required to save.</p>}
            {geminiStatus === GeminiRequestStatus.SUCCESS && activeGeminiAction === 'save_cv_success' && (
                <p className="text-green-700 text-xs text-center mt-1">CV Saved!</p>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              title="Download CV as PDF"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <DownloadIcon className="w-5 h-5" />
              {isPdfGenerating ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        )}
            <div className="flex-1 overflow-y-auto pr-1">
                {activePanel === 'content' && ( <ContentEditorPanel cvData={cvData} onCVDataChange={handleCVDataChange} onAutofillRequest={handleAutofillRequest} onTailorCvRequest={handleTailorCvRequest} geminiStatus={geminiStatus} geminiError={geminiError} clearGeminiError={clearGeminiError} jobDescriptionForTailoring={jobDescriptionForTailoring} onJobDescriptionChange={setJobDescriptionForTailoring} activeGeminiAction={activeGeminiAction} setActiveGeminiAction={setActiveGeminiAction} applyDetailedExperienceUpdates={applyDetailedExperienceUpdates} onApplyDetailedExperienceUpdatesChange={setApplyDetailedExperienceUpdates} /> )}
                {activePanel === 'theme' && ( <ThemeSelectorPanel currentTheme={currentTheme} onThemeChange={handleThemeChange} onThemeOptionChange={handleThemeOptionChange} /> )}
            </div>
        </aside>
        <main className="w-full lg:flex-1 bg-slate-50 overflow-auto p-6 flex justify-center items-start lg:h-full">
            {/* The direct child of main is given h-full to ensure CVPreview can expand if needed, especially when scaled. */}
            <div className="w-full h-full">
                <CVPreview cvData={cvData} theme={currentTheme} templateId={currentTemplateId} />
            </div>
        </main>
      </div>
       {(geminiStatus === GeminiRequestStatus.LOADING || isPdfGenerating) && ( <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" aria-live="assertive" role="alertdialog"> <LoadingSpinner message={ isPdfGenerating ? "Generating PDF..." : activeGeminiAction === 'tailor_cv' ? "JD2CV AI is tailoring your CV..." : activeGeminiAction === 'initial_cv_title' || activeGeminiAction === 'initial_cv_jd' ? "JD2CV AI is crafting your initial CV..." : (geminiStatus === GeminiRequestStatus.LOADING ? "JD2CV AI is thinking..." : "Processing...") } size="w-12 h-12" /> </div> )}
      {geminiError && activePanel !== 'content' && ( <div className="fixed bottom-4 right-4 z-50"> <ErrorMessage message={geminiError} onClear={clearGeminiError} /> </div> )}
    </>
  );
};
export default EditorPage;
