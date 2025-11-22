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

    // Fetch resources
    const { data: resources } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true);

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

    // Build message history
    const messages: Message[] = [
      ...(conversation.messages as Message[]),
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ];

    // Get AI response
    const projectContext = {
      project,
      documents: documents || [],
      proposal,
      resources: resources || [],
    };

    const aiResponse = await chatWithAssistant(messages, projectContext);

    // Add AI response to messages
    const updatedMessages: Message[] = [
      ...messages,
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
