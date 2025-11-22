import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UpdateProposalInput } from '@/lib/types';

// GET /api/proposals/[id] - Get a proposal
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

    // Fetch proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(
        `
        *,
        project:projects (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Proposal not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: proposal });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/proposals/[id] - Update a proposal
export async function PUT(
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

    const body: UpdateProposalInput = await request.json();

    // Get current proposal for history
    const { data: currentProposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Create history entry before updating
    await supabase.from('proposal_history').insert({
      proposal_id: id,
      version: currentProposal.version,
      content: currentProposal.content,
      change_summary: 'Manual edit',
      edited_by: user.id,
    });

    // Update proposal
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Increment version if content changed
    if (body.content) {
      updateData.version = currentProposal.version + 1;
    }

    const { data: proposal, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: proposal });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
