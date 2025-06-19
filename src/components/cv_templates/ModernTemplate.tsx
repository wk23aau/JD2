import React from 'react';
import { CVData, ThemeOptions } from '../../types'; // Adjusted path
import { PersonalInfoSection, SummarySection, ExperienceItem, EducationItem, SkillsSectionItem, SectionTitle } from '../CVPreview'; // Problematic

interface TemplateProps {
  cvData: CVData;
  theme: ThemeOptions;
}

// TODO: Refactor CVPreview for reusable sections.
const ModernTemplate: React.FC<TemplateProps> = ({ cvData, theme }) => {
  return (
    <div id="cv-content-modern" className={`mx-auto ${theme.textColor} bg-${theme.backgroundColor} ${theme.fontFamily} p-6 shadow-lg`} style={{ width: '210mm', minHeight: '297mm' }}>
      <h1 className="text-center text-2xl font-bold mb-4 border-b-2 pb-2 border-blue-500">Modern Template</h1>
      {/* Example of a different structure: Two columns? Sidebar? */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 bg-slate-100 p-4 rounded-md">
          <PersonalInfoSection info={cvData.personalInfo} theme={theme} />
          {cvData.skills.length > 0 && (
            <div className="mb-4 mt-4">
              <SectionTitle title="Skills" primaryColor={theme.primaryColor} />
              {cvData.skills.map(skillCat => <SkillsSectionItem key={skillCat.id} skillItem={skillCat} theme={theme} />)}
            </div>
          )}
        </div>
        <div className="col-span-8">
          {cvData.summary && <SummarySection summary={cvData.summary} theme={theme} />}
          {cvData.experience.length > 0 && (
            <div className="mb-4">
              <SectionTitle title="Experience" primaryColor={theme.primaryColor} />
              {cvData.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} theme={theme} />)}
            </div>
          )}
          {cvData.education.length > 0 && (
            <div className="mb-4">
              <SectionTitle title="Education" primaryColor={theme.primaryColor} />
              {cvData.education.map(edu => <EducationItem key={edu.id} edu={edu} theme={theme} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ModernTemplate;
