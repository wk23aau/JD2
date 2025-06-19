import React from 'react';
import { CVData, ThemeOptions, PersonalInfo, ExperienceEntry, EducationEntry, SkillEntry } from '../types';
import ClassicTemplate from './cv_templates/ClassicTemplate';
import ModernTemplate from './cv_templates/ModernTemplate';

interface CVPreviewProps {
  cvData: CVData;
  theme: ThemeOptions;
  templateId?: string | number | null; // Added templateId
}

// Exporting section components for use in templates (temporary workaround)
export const SectionTitle: React.FC<{ title: string; primaryColor: string }> = ({ title, primaryColor }) => (
  <h2 className={`text-xl font-bold border-b-2 border-${primaryColor} mb-2 pb-1 text-${primaryColor}`}>{title.toUpperCase()}</h2>
);

export const getShortLinkText = (url: string, type: 'linkedin' | 'github' | 'portfolio'): string => {
    if (!url) return '';
    try {
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        const parsedUrl = new URL(cleanUrl);
        
        if (type === 'linkedin') {
            const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
            if (pathParts.length > 1 && (pathParts[0] === 'in' || pathParts[0] === 'pub')) {
                return pathParts[1];
            }
            return parsedUrl.hostname.replace('www.', ''); 
        }
        if (type === 'github') {
            const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
            if (pathParts.length > 0) {
                return pathParts[0]; 
            }
            return parsedUrl.hostname.replace('www.', ''); 
        }
        if (type === 'portfolio') {
            return parsedUrl.hostname.replace('www.', ''); 
        }
    } catch (e) {
        const basicClean = url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
        if (type === 'linkedin' && (url.includes('linkedin.com/in/') || url.includes('linkedin.com/pub/'))) {
             const parts = url.split('/');
             const inIndex = parts.indexOf('in');
             const pubIndex = parts.indexOf('pub');
             if (inIndex !== -1 && parts[inIndex+1]) return parts[inIndex+1];
             if (pubIndex !== -1 && parts[pubIndex+1]) return parts[pubIndex+1];
        }
        if (type === 'github' && url.includes('github.com/')) {
            const parts = url.split('/');
            const ghIndex = parts.indexOf('github.com');
            if (ghIndex !== -1 && parts[ghIndex+1]) return parts[ghIndex+1];
        }
        return basicClean || (type === 'linkedin' ? 'LinkedIn' : type === 'github' ? 'GitHub' : 'Portfolio');
    }
    return url; 
};

export const PersonalInfoSection: React.FC<{ info: PersonalInfo; theme: ThemeOptions }> = ({ info, theme }) => {
  const hasContactInfo = info.showPhone || info.showEmail || info.showLinkedin || info.showGithub || info.showPortfolio;
  const displayPortrait = info.showPortrait && info.portraitUrl;

  const contactItems: (JSX.Element | false)[] = [
    info.showPhone && info.phone && <span key="phone">{info.phone}</span>,
    info.showEmail && info.email && <a key="email" href={`mailto:${info.email}`} className={`hover:text-${theme.primaryColor}`}>{info.email}</a>,
    info.showLinkedin && info.linkedin && <a key="linkedin" href={info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}`} target="_blank" rel="noopener noreferrer" className={`hover:text-${theme.primaryColor}`}>{getShortLinkText(info.linkedin, 'linkedin')}</a>,
    info.showGithub && info.github && <a key="github" href={info.github.startsWith('http') ? info.github : `https://${info.github}`} target="_blank" rel="noopener noreferrer" className={`hover:text-${theme.primaryColor}`}>{getShortLinkText(info.github, 'github')}</a>,
    info.showPortfolio && info.portfolio && <a key="portfolio" href={info.portfolio.startsWith('http') ? info.portfolio : `https://${info.portfolio}`} target="_blank" rel="noopener noreferrer" className={`hover:text-${theme.primaryColor}`}>{getShortLinkText(info.portfolio, 'portfolio')}</a>,
  ];

  const visibleContactItems = contactItems.filter(Boolean) as JSX.Element[];

  return (
    <div className={`mb-6 ${displayPortrait ? "flex flex-row items-start gap-4" : "text-center"}`}>
      {displayPortrait && (
        <div className="flex-shrink-0">
          <img 
            src={info.portraitUrl} 
            alt={`${info.name}'s portrait`} 
            className="w-24 h-24 object-cover rounded-md border border-gray-300 shadow-sm"
          />
        </div>
      )}
      <div className={`${displayPortrait ? "flex-grow text-left" : "text-center"}`}>
        <h1 className={`text-3xl font-bold text-${theme.primaryColor}`}>{info.name}</h1>
        <p className={`text-lg text-${theme.secondaryColor}`}>{info.title}</p>
        
        {hasContactInfo && (
          <div className={`mt-2 text-xs text-${theme.textColor} ${displayPortrait ? "flex flex-col items-start gap-y-0.5" : "flex flex-row flex-wrap justify-center items-center"}`}>
            {displayPortrait ? (
              visibleContactItems.map(item => (
                <span key={item.key} className="flex items-center">{item}</span>
              ))
            ) : (
              visibleContactItems.map((item, index) => (
                <React.Fragment key={item.key || index}>
                  {item}
                  {index < visibleContactItems.length - 1 && <span className="mx-1.5 text-gray-400">|</span>}
                </React.Fragment>
              ))
            )}
          </div>
        )}
        {info.showAddress && info.address && (
          <p className={`text-xs text-gray-500 mt-1 ${!displayPortrait ? 'text-center' : ''}`}>
            {info.address}
          </p>
        )}
      </div>
    </div>
  );
};

export const SummarySection: React.FC<{ summary: string; theme: ThemeOptions }> = ({ summary, theme }) => (
  <div className="mb-4">
    <SectionTitle title="Summary" primaryColor={theme.primaryColor} />
    <p className={`text-sm text-${theme.textColor} leading-relaxed`}>{summary}</p>
  </div>
);

export const ExperienceItem: React.FC<{ exp: ExperienceEntry; theme: ThemeOptions }> = ({ exp, theme }) => (
  <div className="mb-3">
    <h3 className={`text-md font-semibold text-${theme.textColor}`}>{exp.jobTitle}</h3>
    <div className="flex justify-between items-center">
        <p className={`text-sm font-medium text-${theme.secondaryColor}`}>{exp.company}</p>
        <p className={`text-xs text-gray-500`}>{exp.location}</p>
    </div>
    <p className={`text-xs text-gray-500 mb-1`}>{exp.startDate} - {exp.endDate}</p>
    <ul className={`list-disc list-inside ml-4 text-sm text-${theme.textColor} space-y-0.5`}>
      {exp.responsibilities.map((resp, index) => <li key={index}>{resp}</li>)}
    </ul>
  </div>
);

export const EducationItem: React.FC<{ edu: EducationEntry; theme: ThemeOptions }> = ({ edu, theme }) => (
  <div className="mb-3">
    <h3 className={`text-md font-semibold text-${theme.textColor}`}>{edu.degree}</h3>
    <div className="flex justify-between items-center">
        <p className={`text-sm font-medium text-${theme.secondaryColor}`}>{edu.institution}</p>
        <p className={`text-xs text-gray-500`}>{edu.location}</p>
    </div>
    <p className={`text-xs text-gray-500 mb-1`}>{edu.graduationDate}</p>
    {edu.details && edu.details.length > 0 && (
      <ul className={`list-disc list-inside ml-4 text-sm text-${theme.textColor} space-y-0.5`}>
        {edu.details.map((detail, index) => <li key={index}>{detail}</li>)}
      </ul>
    )}
  </div>
);

export const SkillsSectionItem: React.FC<{ skillItem: SkillEntry; theme: ThemeOptions }> = ({ skillItem, theme }) => (
  <div className="mb-2">
    <h4 className={`text-sm font-semibold text-${theme.secondaryColor}`}>{skillItem.category}:</h4>
    <p className={`text-sm text-${theme.textColor}`}>{skillItem.skills.join(', ')}</p>
  </div>
);

const CVPreview: React.FC<CVPreviewProps> = ({ cvData, theme, templateId }) => {
  const scale = theme.previewScale || 1;

  let templateToRender;
  // Default to 'classic' if templateId is null, undefined, or explicitly 'classic' or 1 (from seeded data)
  // The seeded backend data uses string IDs 'classic' and 'modern' for templates, but IDs from DB are numbers.
  // So, we check for both numeric and string versions.
  const templateIdStr = String(templateId).toLowerCase();

  if (templateIdStr === 'modern' || templateIdStr === '2') {
    templateToRender = <ModernTemplate cvData={cvData} theme={theme} />;
  } else { // Default to Classic for 'classic', '1', or any other/undefined value
    templateToRender = <ClassicTemplate cvData={cvData} theme={theme} />;
  }

  return (
    <div 
        className={`p-6 shadow-lg overflow-y-auto bg-${theme.backgroundColor}`} // Outer div for editor UI scaling & bg
        style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease-out',
            width: (210 * scale) + 'mm', /* Adjust container width based on scale */
            minHeight: (297 * scale) + 'mm' /* Adjust container minHeight based on scale */
        }}
        aria-label="CV Preview Area"
    >
      {/* The actual template content with A4 styling is now inside ClassicTemplate/ModernTemplate */}
      {templateToRender}
    </div>
  );
};

export default CVPreview;
