import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  extractDocxContent,
  parseProjectData,
  parseBiosObjectives,
} from '@/lib/document/parser';

export const maxDuration = 60;

// POST /api/documents/upload - Upload and process a document
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string;
    const documentType = formData.get('type') as 'project_data' | 'bios_objectives';

    if (!file || !projectId || !documentType) {
      return NextResponse.json(
        { error: 'File, project_id, and type are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !file.name.endsWith('.docx') &&
      !file.name.endsWith('.doc')
    ) {
      return NextResponse.json(
        { error: 'Only .docx files are supported' },
        { status: 400 }
      );
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract content from DOCX
    const { text, html } = await extractDocxContent(buffer);

    // Parse metadata based on document type
    let metadata: any = {};
    if (documentType === 'project_data') {
      metadata = parseProjectData(text);

      // Update project with extracted metadata
      await supabase
        .from('projects')
        .update({
          project_number: metadata.project_number || null,
          project_type: metadata.project_type || null,
          start_date: metadata.start_date || null,
          end_date: metadata.end_date || null,
          estimated_participants: metadata.estimated_participants || null,
          subject: metadata.subject || null,
          project_objectives: metadata.project_objectives || null,
        })
        .eq('id', projectId);
    } else if (documentType === 'bios_objectives') {
      metadata = parseBiosObjectives(text);
    }

    // Upload file to Supabase Storage
    const fileName = `${projectId}/${documentType}_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(fileName);

    // Check if document of this type already exists for this project
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('project_id', projectId)
      .eq('type', documentType)
      .single();

    let document;

    if (existingDoc) {
      // Update existing document
      const { data, error } = await supabase
        .from('documents')
        .update({
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          extracted_content: text,
          extracted_metadata: metadata,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      document = data;
    } else {
      // Create new document
      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          extracted_content: text,
          extracted_metadata: metadata,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      document = data;
    }

    return NextResponse.json({
      data: {
        document,
        extracted_metadata: metadata,
      },
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
