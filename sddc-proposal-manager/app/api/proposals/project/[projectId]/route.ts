import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/proposals/project/[projectId] - Get proposal for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { projectId } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch proposal for this project
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is fine
      return NextResponse.json(
        { error: 'Failed to fetch proposal' },
        { status: 500 }
      );
    }

    if (!proposal) {
      return NextResponse.json(
        { data: null, message: 'No proposal found for this project' },
        { status: 200 }
      );
    }

    return NextResponse.json({ data: proposal });
  } catch (error: any) {
    console.error('Proposal fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
