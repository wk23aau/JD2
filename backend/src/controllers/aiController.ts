import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as geminiService from '../services/geminiService';

/**
 * Generates a CV summary based on provided CV data or job description.
 */
export const generateSummaryHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Ensure user is authenticated (though `protect` middleware should handle this)
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { existingCvData, jobDescription, userPreferences } = req.body;
  // cvData might contain sections like experience, skills, education
  // jobDescription is the target job description string
  // userPreferences could be specific keywords or tone (e.g., "professional", "creative")

  let prompt = "Generate a concise and impactful professional summary for a CV.";

  if (jobDescription) {
    prompt += ` The summary should be tailored for a job with the following description: "${jobDescription.substring(0, 200)}..."`;
  }
  if (existingCvData && typeof existingCvData === 'object') {
    // Crude way to add some context from CV data; a more sophisticated prompt would be better.
    const keyPoints = [];
    if (existingCvData.personalInfo?.title) keyPoints.push(`Current role: ${existingCvData.personalInfo.title}`);
    if (existingCvData.experience?.length > 0) keyPoints.push(`Key experience in: ${existingCvData.experience.map(exp => exp.jobTitle).join(', ')}`);
    if (existingCvData.skills?.length > 0) keyPoints.push(`Key skills: ${existingCvData.skills.map(skill => skill.category || skill.skills?.join(', ')).join(', ')}`);

    if (keyPoints.length > 0) {
        prompt += `\nKey information to consider from the candidate's profile: ${keyPoints.join('; ')}.`;
    }
  }
  if (userPreferences?.tone) {
    prompt += `\nThe desired tone is ${userPreferences.tone}.`;
  }
   prompt += "\nKeep the summary to 3-4 sentences.";


  try {
    const summary = await geminiService.generateCvContent(prompt);
    res.status(200).json({ summary });
  } catch (error) {
    // Log the error if needed, or rely on a central error logger
    // console.error("Error in generateSummaryHandler:", error);
    next(error); // Pass to the global error handler
  }
};

/**
 * Generates bullet points for a work experience entry.
 */
export const generateExperiencePointsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { jobTitle, company, responsibilitiesContext, keywords } = req.body;
  // jobTitle: e.g., "Software Engineer"
  // company: e.g., "Tech Solutions Inc."
  // responsibilitiesContext: e.g., "Developed and maintained web applications using React and Node.js."
  // keywords: e.g., ["agile", "TDD", "CI/CD"]

  if (!jobTitle || !company) {
    res.status(400).json({ message: 'Job title and company are required to generate experience points.' });
    return;
  }

  let prompt = `Generate 3-5 impactful, action-oriented bullet points for a CV work experience section.
Job Title: ${jobTitle}
Company: ${company}`;
  if (responsibilitiesContext) {
    prompt += `\nKey responsibilities or context: "${responsibilitiesContext}"`;
  }
  if (keywords && Array.isArray(keywords) && keywords.length > 0) {
    prompt += `\nIncorporate these keywords if relevant: ${keywords.join(', ')}.`;
  }
  prompt += `\nFocus on achievements and quantify results where possible. Each bullet point should start with an action verb.`;

  try {
    const bulletPointsText = await geminiService.generateCvContent(prompt);
    // The AI might return a single string with newlines or bullet characters.
    // Basic splitting; more robust parsing might be needed based on actual AI output format.
    const bulletPoints = bulletPointsText.split('\n').map(line => line.replace(/^- /,'').trim()).filter(line => line.length > 0);
    res.status(200).json({ bulletPoints });
  } catch (error) {
    next(error);
  }
};
