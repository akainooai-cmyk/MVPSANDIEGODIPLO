import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateProposal } from '@/lib/claude/generate';

export const maxDuration = 60; // Allow up to 60 seconds for AI generation

// POST /api/proposals/generate - Generate a new proposal using Claude AI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch project documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', project_id);

    // Extract project_data and bios_objectives
    const projectDataDoc = documents?.find((d) => d.type === 'project_data');
    const biosObjectivesDoc = documents?.find(
      (d) => d.type === 'bios_objectives'
    );

    // Fetch all active resources from database
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true);

    if (resourcesError) {
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      );
    }

    // Generate proposal using Claude AI
    const proposalContent = await generateProposal(
      {
        ...project,
        extracted_content: projectDataDoc?.extracted_content,
        extracted_metadata: projectDataDoc?.extracted_metadata,
      },
      biosObjectivesDoc
        ? {
            extracted_content: biosObjectivesDoc.extracted_content,
            extracted_metadata: biosObjectivesDoc.extracted_metadata,
          }
        : null,
      resources || []
    );

    // Check if a proposal already exists for this project
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('project_id', project_id)
      .single();

    let proposal;

    if (existingProposal) {
      // Update existing proposal
      const { data, error } = await supabase
        .from('proposals')
        .update({
          content: proposalContent,
          version: existingProposal.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProposal.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Create history entry
      await supabase.from('proposal_history').insert({
        proposal_id: existingProposal.id,
        version: existingProposal.version,
        content: existingProposal.content,
        change_summary: 'AI regeneration',
        edited_by: user.id,
      });

      proposal = data;
    } else {
      // Create new proposal
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          project_id,
          content: proposalContent,
          version: 1,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      proposal = data;
    }

    return NextResponse.json({ data: proposal });
  } catch (error: any) {
    console.error('Proposal generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
