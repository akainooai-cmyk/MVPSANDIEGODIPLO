import mammoth from 'mammoth';

/**
 * Extract text content from a DOCX file
 */
export async function extractDocxContent(buffer: Buffer): Promise<{
  text: string;
  html: string;
}> {
  try {
    // Extract plain text
    const textResult = await mammoth.extractRawText({ buffer });

    // Extract HTML (with formatting)
    const htmlResult = await mammoth.convertToHtml({ buffer });

    return {
      text: textResult.value,
      html: htmlResult.value,
    };
  } catch (error) {
    console.error('Error extracting DOCX content:', error);
    throw new Error('Failed to extract document content');
  }
}

/**
 * Parse project data document and extract structured metadata
 */
export function parseProjectData(text: string): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Extract project number (e.g., E/VRF-2025-0055)
  const projectNumberMatch = text.match(/E\/[A-Z]+-\d{4}-\d{4}/);
  if (projectNumberMatch) {
    metadata.project_number = projectNumberMatch[0];
  }

  // Extract dates (various formats)
  const datePattern =
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|([A-Z][a-z]+ \d{1,2}, \d{4})/g;
  const dates = text.match(datePattern);
  if (dates && dates.length >= 2) {
    metadata.start_date = dates[0];
    metadata.end_date = dates[1];
  }

  // Extract participant count
  const participantMatch = text.match(/(\d+)\s*participants?/i);
  if (participantMatch) {
    metadata.estimated_participants = parseInt(participantMatch[1]);
  }

  // Extract subject/theme
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  if (subjectMatch) {
    metadata.subject = subjectMatch[1].trim();
  }

  // Extract project type
  const typeMatch = text.match(/Project Type:\s*(.+)/i);
  if (typeMatch) {
    metadata.project_type = typeMatch[1].trim();
  }

  // Extract objectives (look for numbered lists)
  const objectives: string[] = [];
  const objectivePattern = /(?:^|\n)\s*\d+[.)]\s*([\s\S]+?)(?=\n\s*\d+[.)]|\n\n|$)/g;
  let match;
  while ((match = objectivePattern.exec(text)) !== null) {
    if (match[1]) {
      objectives.push(match[1].trim());
    }
  }
  if (objectives.length > 0) {
    metadata.project_objectives = objectives;
  }

  return metadata;
}

/**
 * Parse bios and objectives document
 */
export function parseBiosObjectives(text: string): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Extract participant bios (look for names and descriptions)
  const participants: Array<{ name: string; bio: string }> = [];

  // Simple pattern to detect names (all caps or Title Case followed by description)
  const bioPattern = /([A-Z][A-Za-z\s]+):\s*([\s\S]+?)(?=\n[A-Z][A-Za-z\s]+:|\n\n|$)/g;
  let match;
  while ((match = bioPattern.exec(text)) !== null) {
    participants.push({
      name: match[1].trim(),
      bio: match[2].trim(),
    });
  }

  if (participants.length > 0) {
    metadata.participants = participants;
  }

  // Extract learning objectives
  const objectives: string[] = [];
  const objPattern =
    /(?:learning objectives?|objectives?):\s*([\s\S]+?)(?=\n\n|$)/gi;
  const objMatch = objPattern.exec(text);
  if (objMatch) {
    const objText = objMatch[1];
    const objList = objText.split(/\n/).filter((line) => line.trim());
    objectives.push(...objList);
  }

  if (objectives.length > 0) {
    metadata.learning_objectives = objectives;
  }

  return metadata;
}
