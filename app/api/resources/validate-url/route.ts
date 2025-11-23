import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateUrl, validateUrls } from '@/lib/utils/url-validator';

export const maxDuration = 30; // Allow up to 30 seconds for URL validation

// POST /api/resources/validate-url - Validate one or multiple URLs
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

    const body = await request.json();
    const { url, urls } = body;

    // Validate single URL
    if (url) {
      const result = await validateUrl(url);
      return NextResponse.json({
        data: result,
      });
    }

    // Validate multiple URLs
    if (urls && Array.isArray(urls)) {
      const results = await validateUrls(urls);
      return NextResponse.json({
        data: results,
      });
    }

    return NextResponse.json(
      { error: 'Either url or urls parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('URL validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
