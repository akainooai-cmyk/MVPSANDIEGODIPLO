import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const proposalId = resolvedParams.id;

    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*, projects(*)')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const content = proposal.content;

    // Use Claude to analyze the proposal and suggest improvements
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are an expert in creating IVLP proposals. Analyze this proposal and provide 3-5 concrete suggestions for improvement.

Project Theme: ${proposal.projects.theme}
Project Dates: ${proposal.projects.start_date} to ${proposal.projects.end_date}

Current Proposal Content:
${JSON.stringify(content, null, 2)}

Provide suggestions in the following categories:
1. Resources that could be added (specific organizations in San Diego)
2. Resources that might not be the best fit (explain why and suggest alternatives)
3. Improvements to "meeting focus" descriptions
4. Better explanations in "Why San Diego"
5. Balance of resources across categories

Format your response as JSON:
{
  "suggestions": [
    {
      "type": "add_resource" | "replace_resource" | "improve_description" | "improve_why_sd" | "balance",
      "priority": "high" | "medium" | "low",
      "title": "Brief title",
      "description": "Detailed explanation",
      "action": "Specific action to take",
      "target": "Which resource or section (if applicable)"
    }
  ]
}

Return ONLY the JSON, no other text.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Failed to generate suggestions',
        suggestions: [],
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ suggestions: result.suggestions });
  } catch (error: any) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions', message: error.message },
      { status: 500 }
    );
  }
}
