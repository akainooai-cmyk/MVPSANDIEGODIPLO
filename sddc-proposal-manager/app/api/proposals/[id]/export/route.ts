import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateProposalDocx } from '@/lib/document/generator';

export const maxDuration = 60;

// GET /api/proposals/[id]/export - Export proposal as DOCX
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch proposal with project data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(
        `
        *,
        project:projects (*)
      `
      )
      .eq('id', id)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const project = proposal.project;

    // Generate DOCX
    const docxBuffer = await generateProposalDocx({
      projectTitle: project.project_title || project.name,
      projectNumber: project.project_number,
      projectType: project.project_type,
      startDate: project.start_date
        ? new Date(project.start_date).toLocaleDateString()
        : undefined,
      endDate: project.end_date
        ? new Date(project.end_date).toLocaleDateString()
        : undefined,
      content: proposal.content,
    });

    // Generate filename
    const filename = `${project.project_number || 'proposal'}_${
      project.name
    }_v${proposal.version}.docx`.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Return file as download
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': docxBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export proposal' },
      { status: 500 }
    );
  }
}
