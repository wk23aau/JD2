import React from 'react';
import { CVData, ThemeOptions } from '../../types'; // Adjusted path
// Import original sections or new versions if needed
// For now, let's assume we can reuse some, but this will be more complex
import { PersonalInfoSection, SummarySection, ExperienceItem, EducationItem, SkillsSectionItem, SectionTitle } from '../CVPreview'; // This is problematic, CVPreview shouldn't export its own sections like this.

interface TemplateProps {
  cvData: CVData;
  theme: ThemeOptions; // Templates can still use theme for colors/fonts
}

// TODO: Refactor CVPreview to make its sections reusable or create new general section components.
// For this subtask, this direct import from CVPreview is a temporary workaround to see structure.
// This implies CVPreview.tsx needs to export these components.

const ClassicTemplate: React.FC<TemplateProps> = ({ cvData, theme }) => {
  return (
    <div id="cv-content-classic" className={`mx-auto ${theme.textColor} bg-${theme.backgroundColor} ${theme.fontFamily} p-6 shadow-lg`} style={{ width: '210mm', minHeight: '297mm' }}>
      <h1 className="text-center text-2xl font-bold mb-4 border-b-2 pb-2 border-gray-400">Classic Template</h1>
      <PersonalInfoSection info={cvData.personalInfo} theme={theme} />
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
      {cvData.skills.length > 0 && (
        <div className="mb-4">
          <SectionTitle title="Skills" primaryColor={theme.primaryColor} />
          {cvData.skills.map(skillCat => <SkillsSectionItem key={skillCat.id} skillItem={skillCat} theme={theme} />)}
        </div>
      )}
      {/* Specific classic layout adjustments would go here */}
    </div>
  );
};
export default ClassicTemplate;
