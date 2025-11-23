import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateProposal } from '@/lib/claude/generate';
import { validateUrls } from '@/lib/utils/url-validator';
import type { ProposalContent, ResourceItem, CulturalActivity } from '@/lib/types';

export const maxDuration = 120; // Allow up to 120 seconds for AI generation + URL validation

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
    let proposalContent = await generateProposal(
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

    // Validate all URLs in the proposal
    const allUrls: string[] = [];
    const urlToResourceMap = new Map<string, { type: string; index: number }>();

    // Collect all URLs from resources
    proposalContent.governmental_resources.forEach((r, i) => {
      if (r.url) {
        allUrls.push(r.url);
        urlToResourceMap.set(r.url, { type: 'governmental', index: i });
      }
    });
    proposalContent.academic_resources.forEach((r, i) => {
      if (r.url) {
        allUrls.push(r.url);
        urlToResourceMap.set(r.url, { type: 'academic', index: i });
      }
    });
    proposalContent.nonprofit_resources.forEach((r, i) => {
      if (r.url) {
        allUrls.push(r.url);
        urlToResourceMap.set(r.url, { type: 'nonprofit', index: i });
      }
    });
    proposalContent.cultural_activities.forEach((r, i) => {
      if (r.url) {
        allUrls.push(r.url);
        urlToResourceMap.set(r.url, { type: 'cultural', index: i });
      }
    });

    // Validate all URLs in parallel
    if (allUrls.length > 0) {
      console.log(`Validating ${allUrls.length} URLs...`);
      const validationResults = await validateUrls(allUrls, 10); // 10 concurrent validations

      // Filter out invalid URLs
      const invalidUrls = validationResults
        .filter(r => !r.isValid)
        .map(r => r.url);

      if (invalidUrls.length > 0) {
        console.log(`Found ${invalidUrls.length} invalid URLs, filtering them out...`);

        // Remove resources with invalid URLs
        proposalContent.governmental_resources = proposalContent.governmental_resources.filter(
          r => !invalidUrls.includes(r.url)
        );
        proposalContent.academic_resources = proposalContent.academic_resources.filter(
          r => !invalidUrls.includes(r.url)
        );
        proposalContent.nonprofit_resources = proposalContent.nonprofit_resources.filter(
          r => !invalidUrls.includes(r.url)
        );
        proposalContent.cultural_activities = proposalContent.cultural_activities.filter(
          r => !invalidUrls.includes(r.url)
        );

        console.log(`Filtered proposal resources. Remaining counts:
          - Governmental: ${proposalContent.governmental_resources.length}
          - Academic: ${proposalContent.academic_resources.length}
          - Nonprofit: ${proposalContent.nonprofit_resources.length}
          - Cultural: ${proposalContent.cultural_activities.length}`);
      } else {
        console.log('All URLs are valid!');
      }
    }

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
