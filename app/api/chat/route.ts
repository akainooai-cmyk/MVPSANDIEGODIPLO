import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { chatWithAssistant } from '@/lib/claude/generate';
import type { Message } from '@/lib/types';

export const maxDuration = 60; // Allow up to 60 seconds for AI response

// POST /api/chat - Send a message to Claude AI
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

    const { project_id, message } = await request.json();

    if (!project_id || !message) {
      return NextResponse.json(
        { error: 'Project ID and message are required' },
        { status: 400 }
      );
    }

    // Fetch project context
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

    // Fetch documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', project_id);

    // Fetch proposal if exists
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('project_id', project_id)
      .single();

    // Get or create conversation
    let conversation;
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (existingConversation) {
      conversation = existingConversation;
    } else {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          project_id,
          messages: [],
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      conversation = newConversation;
    }

    // Build message history - keep only the last 20 messages to avoid token limits
    const allMessages = conversation.messages as Message[];
    const recentMessages = allMessages.slice(-20);

    const messages: Message[] = [
      ...recentMessages,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ];

    // Get AI response - simplified context to avoid token limits
    const projectContext = {
      project: {
        id: project.id,
        project_title: project.project_title,
        project_type: project.project_type,
        start_date: project.start_date,
        end_date: project.end_date,
        estimated_participants: project.estimated_participants,
        status: project.status,
      },
      documents: (documents || []).map((doc) => ({
        name: doc.name,
        file_type: doc.file_type,
        uploaded_at: doc.uploaded_at,
      })),
      proposal: proposal ? {
        id: proposal.id,
        version: proposal.version,
        status: proposal.status,
        has_content: !!proposal.content,
        // Only send summary info, not full content to save tokens
        resource_counts: {
          governmental: proposal.content?.governmental_resources?.length || 0,
          academic: proposal.content?.academic_resources?.length || 0,
          nonprofit: proposal.content?.nonprofit_resources?.length || 0,
          cultural: proposal.content?.cultural_activities?.length || 0,
        },
        why_san_diego_preview: proposal.content?.why_san_diego?.substring(0, 200) || '',
      } : null,
    };

    const aiResponse = await chatWithAssistant(messages, projectContext);

    // Add AI response to ALL messages (not just recent ones)
    const updatedMessages: Message[] = [
      ...allMessages,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update conversation
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        message: aiResponse,
        conversation_id: conversation.id,
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
