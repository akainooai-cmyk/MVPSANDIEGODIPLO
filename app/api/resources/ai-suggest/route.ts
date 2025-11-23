import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load the database resources for context
let resourcesData: any[] = [];

try {
  const filePath = path.join(process.cwd(), 'database_resources.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  resourcesData = JSON.parse(fileContent);
} catch (error) {
  console.error('Failed to load database_resources.json:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { category, context } = await request.json();

    // Map category names
    const categoryMap: { [key: string]: string } = {
      governmental: 'Governmental',
      academic: 'Academic',
      nonprofit: 'Nonprofit/NGO',
      cultural: 'Cultural',
    };

    const targetCategory = categoryMap[category];

    // Get sample resources from database for this category
    const categoryResources = resourcesData
      .filter((r) => r.category === targetCategory)
      .slice(0, 20);

    const contextInfo = context
      ? `User is looking for: ${context}`
      : `Suggest general high-quality resources`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an expert on San Diego resources for international visitor exchange programs (IVLP).

Task: Suggest 3-5 excellent ${category} resources in San Diego for IVLP participants.

${contextInfo}

Here are some examples from our database for context:
${JSON.stringify(categoryResources.slice(0, 5), null, 2)}

Based on this, suggest NEW resources (not necessarily from the list) that would be highly valuable for IVLP participants. Focus on:
- Organizations with international connections or global perspectives
- Institutions that showcase San Diego's innovation and diversity
- Resources that provide unique learning opportunities
- Organizations willing to host international visitors

For each suggestion, provide:
{
  "name": "Exact organization name",
  "url": "Official website URL",
  "description": "2-3 sentences about the organization and its relevance",
  "meeting_focus": "Specific activities or topics participants would engage with during the visit"
}

Return ONLY a JSON array of 3-5 resources. No other text.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Failed to parse AI response',
        suggestions: [],
      });
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { error: 'Suggestion failed', message: error.message },
      { status: 500 }
    );
  }
}
