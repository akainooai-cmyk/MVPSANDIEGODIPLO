import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, category } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use Claude to search the web and extract relevant resources
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are helping find ${category} resources in San Diego for an international visitor exchange program (IVLP).

Search query: "${query}"

Please find 3-5 relevant ${category} organizations or institutions in San Diego that would be suitable for IVLP participants.

For each resource, provide:
1. Exact organization name
2. Official website URL
3. Brief description (2-3 sentences) focusing on their relevance to international visitors
4. Why they would be valuable for IVLP participants

Format your response as a JSON array like this:
[
  {
    "name": "Organization Name",
    "url": "https://...",
    "description": "Description here",
    "meeting_focus": "What participants will learn or experience"
  }
]

Only return the JSON array, nothing else.`,
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
        results: [],
      });
    }

    const results = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: error.message },
      { status: 500 }
    );
  }
}
