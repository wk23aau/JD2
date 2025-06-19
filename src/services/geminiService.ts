import {
    CVData,
    ExperienceEntry,
    EducationEntry,
    TailoredCVUpdate,
    SectionContentType,
    GenerationContext
} from "../types";

// Removed getAuthToken placeholder and direct SDK usage

export async function generateCVContent(
  token: string | null, // Added token as the first argument
  sectionType: SectionContentType,
  userInput: string,
  context?: GenerationContext
): Promise<string | string[] | ExperienceEntry | EducationEntry | CVData | TailoredCVUpdate> {

  if (!token) {
    console.error("Authentication token not provided to generateCVContent service.");
    throw new Error("Authentication required to generate AI content.");
  }

  const requestBody = {
    sectionType,
    userInput,
    context,
  };

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Use the passed token
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      console.error('Backend AI proxy request failed:', errorData);
      throw new Error(errorData.message || `Failed to generate content via backend. Status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error calling backend AI proxy:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while communicating with the AI backend proxy.');
  }
}
