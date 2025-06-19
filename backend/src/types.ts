// Types duplicated/adapted from frontend src/types.ts for backend use

export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
  github?: string;
  portfolio?: string;
  address?: string;
  portraitUrl?: string;
  showPortrait?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showLinkedin?: boolean;
  showGithub?: boolean;
  showPortfolio?: boolean;
  showAddress?: boolean;
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
}

export interface EducationEntry {
  id:string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  details?: string[];
}

export interface SkillEntry {
  id: string;
  category: string;
  skills: string[];
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
}

// Union type for all possible generation types Gemini service can handle
// Mirrored from frontend src/types.ts SectionContentType
export type SectionContentType =
  | "summary"
  | "experience_responsibilities"
  | "education_details"
  | "skill_suggestions"
  | "new_experience_entry"
  | "new_education_entry"
  | "initial_cv_from_title"
  | "initial_cv_from_job_description"
  | "tailor_cv_to_job_description";

// Context for AI generation, can be expanded
// Context for AI generation, adapted from frontend's geminiService.ts
export interface GenerationContext {
  jobTitle?: string;
  company?: string;
  degree?: string;
  institution?: string;
  skillCategory?: string;     // For skill_suggestions
  existingCV?: Partial<CVData>; // For providing existing CV data as context
  // prompt?: string; // This seems to be covered by userInput in GenerateAIContentRequest
  // generationType?: SectionContentType; // This is sectionType in GenerateAIContentRequest
  jobDescription?: string;    // For CV tailoring or initial generation from JD
  applyDetailedExperienceUpdates?: boolean; // For controlling tailoring depth in CV tailoring
}

// Expected request body for the /api/ai/generate endpoint
export interface GenerateAIContentRequest {
  sectionType: SectionContentType;
  userInput: string; // This could be a job title, company name, job description, user query for specific section etc.
  context?: GenerationContext;
}
