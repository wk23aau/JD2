import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, WandSparklesIcon } from '../constants'; // Assuming constants.tsx is in src/
import { trackEvent } from '../services/analyticsService';

// Define a type for the template data received from API
interface CVTemplate {
  id: string | number; // Adjust based on actual API response id type
  name: string;
  description: string;
  preview_image_url?: string; // Optional preview image
}

// Placeholder for CV Template Grid Item
const CVTemplateCard: React.FC<{ template: CVTemplate; onSelect: () => void }> = ({ template, onSelect }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex flex-col justify-between" onClick={onSelect}>
    <div>
      <div className="h-40 bg-slate-200 mb-4 rounded-md flex items-center justify-center">
        {template.preview_image_url ? (
          <img src={template.preview_image_url} alt={template.name} className="object-contain h-full w-full rounded-md" />
        ) : (
          <span className="text-slate-500">Template Preview</span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{template.name}</h3>
      <p className="text-slate-600 text-sm mb-4">{template.description}</p>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-auto"
    >
      Use Template
    </button>
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(true);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      setTemplateError(null);
      try {
        // Assuming the backend is running on port 3001 and accessible via /api
        // Adjust the URL if your backend setup is different or if using a proxy
        const response = await fetch('/api/cv-templates'); // Or full URL: http://localhost:3001/api/cv-templates
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`);
        }
        const data: CVTemplate[] = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Error fetching CV templates:", error);
        setTemplateError(error instanceof Error ? error.message : 'An unknown error occurred.');
        setTemplates([ // Fallback to some default mock templates on error
            { id: 'classic_mock', name: 'Classic (Mock)', description: 'Error loading. A timeless professional format.' },
            { id: 'modern_mock', name: 'Modern (Mock)', description: 'Error loading. Sleek for contemporary roles.' },
        ]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleGenerateCV = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('generate_cv_landing', { event_category: 'CV Generation', event_label: 'Landing Page Start', value: (jobTitle ? 1 : 0) + (jobDescription ? 1 : 0) });
    const selectedTemplateId = templates.length > 0 ? templates[0].id : undefined;
    navigate('/editor', { state: { jobTitle, jobDescription, selectedTemplateId } });
  };

  const handleSelectTemplate = (templateId: string | number) => {
    trackEvent('select_template_landing', { event_category: 'Template Selection', event_label: `Template ID: ${templateId} (Landing)` });
     navigate('/editor', { state: { selectedTemplateId: templateId, jobTitle, jobDescription } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero/Prompt Area */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="container mx-auto">
          <WandSparklesIcon className="w-20 h-20 text-yellow-300 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Craft Your Perfect CV, Instantly</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Leverage AI to tailor your resume for any job. Input a job title or description, pick a template, and let us handle the rest!
          </p>
          <form onSubmit={handleGenerateCV} className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-xl text-slate-700 space-y-6">
            <div>
              <label htmlFor="jobTitleLanding" className="sr-only">Job Title</label>
              <input
                type="text"
                id="jobTitleLanding"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter target job title (optional)"
                className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="jobDescriptionLanding" className="sr-only">Job Description</label>
              <textarea
                id="jobDescriptionLanding"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Or paste the full job description here..."
                rows={5}
                className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <SparklesIcon className="w-6 h-6" />
              Start Generating CV
            </button>
             <p className="text-xs text-slate-500 mt-2">Or, scroll down to pick a template first!</p>
          </form>
        </div>
      </section>

      {/* CV Templates Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-slate-800 text-center mb-10">Choose Your Starting Point</h3>
          {isLoadingTemplates && (
            <div className="text-center">
              {/* Basic Loading Spinner - replace with actual component if available */}
              <p className="text-slate-600">Loading templates...</p>
            </div>
          )}
          {templateError && (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">
              <p>Error loading templates: {templateError}</p>
              <p>Displaying mock templates as a fallback.</p>
            </div>
          )}
          {!isLoadingTemplates && templates.length === 0 && !templateError && (
            <p className="text-center text-slate-600">No templates available at the moment. Please check back later.</p>
          )}
          {!isLoadingTemplates && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map(template => (
                <CVTemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleSelectTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
