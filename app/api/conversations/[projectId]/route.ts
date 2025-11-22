import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/conversations/[projectId] - Get conversation history for a project
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

    // Get conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is fine
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: conversation || { messages: [] },
    });
  } catch (error: any) {
    console.error('Conversation fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
