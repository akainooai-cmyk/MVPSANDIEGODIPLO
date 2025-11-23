import { anthropic } from './client';
import {
  PROPOSAL_GENERATION_PROMPT,
  buildProposalGenerationPrompt,
  buildChatPrompt,
} from './prompts';
import type { ProposalContent, Message, ProjectContext } from '@/lib/types';

/**
 * Generate a complete proposal using Claude AI
 */
export async function generateProposal(
  projectData: any,
  biosObjectives: any | null,
  resources: any[]
): Promise<ProposalContent> {
  const userPrompt = buildProposalGenerationPrompt(
    projectData,
    biosObjectives,
    resources
  );

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    system: PROPOSAL_GENERATION_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];

  if (content.type === 'text') {
    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse JSON from Claude response');
  }

  throw new Error('Invalid response type from Claude');
}

/**
 * Chat with Claude AI about a project
 */
export async function chatWithAssistant(
  messages: Message[],
  projectContext: ProjectContext
): Promise<string> {
  const systemPrompt = buildChatPrompt(projectContext);

  const anthropicMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const content = response.content[0];

  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Invalid response type from Claude');
}

/**
 * Improve a specific section of a proposal
 */
export async function improveProposalSection(
  sectionName: string,
  currentContent: string,
  projectData: any,
  feedback?: string
): Promise<string> {
  const prompt = `
Améliore la section "${sectionName}" du proposal suivant.

## Contexte du projet
${JSON.stringify(projectData, null, 2)}

## Contenu actuel
${currentContent}

${feedback ? `## Feedback à prendre en compte\n${feedback}` : ''}

Réponds uniquement avec le texte amélioré, sans explications supplémentaires.
Maintiens un ton professionnel et diplomatique.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];

  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Invalid response type from Claude');
}
