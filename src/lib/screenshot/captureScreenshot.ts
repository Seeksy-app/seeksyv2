import { supabase } from "@/integrations/supabase/client";

export interface CaptureScreenshotParams {
  url: string;
  pageName: string;
  category: 'advertiser-tools' | 'creator-tools' | 'internal' | 'external' | 'onboarding';
  description?: string;
}

export interface CaptureScreenshotResult {
  id: string;
  page_name: string;
  url: string;
  category: string;
  screenshot_path: string;
  public_url: string;
  created_at: string;
}

/**
 * Capture a screenshot using the Screenshot API service
 * This is an abstraction layer that can be replaced with Playwright later
 */
export async function captureScreenshot({
  url,
  pageName,
  category,
  description,
}: CaptureScreenshotParams): Promise<CaptureScreenshotResult> {
  console.log('[captureScreenshot] Starting capture for:', url, pageName);
  
  const { data, error } = await supabase.functions.invoke('capture-screenshot', {
    body: {
      url,
      pageName,
      category,
      description,
    },
  });

  if (error) {
    console.error('[captureScreenshot] Edge function error:', {
      message: error.message,
      name: error.name,
      context: error.context,
      status: error.status,
    });
    
    // Extract more meaningful error message
    const errorMsg = error.message || 'Failed to capture screenshot';
    throw new Error(`Screenshot failed: ${errorMsg}`);
  }

  if (!data?.success) {
    const errorDetail = data?.error || 'Unknown error from screenshot service';
    console.error('[captureScreenshot] API returned failure:', errorDetail);
    throw new Error(errorDetail);
  }

  console.log('[captureScreenshot] Success:', data.screenshot?.page_name);
  return data.screenshot;
}

/**
 * Fetch all screenshots from the database
 */
export async function fetchScreenshots(category?: string) {
  let query = supabase
    .from('ui_screenshots')
    .select('*')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fetch screenshots error:', error);
    throw new Error(error.message || 'Failed to fetch screenshots');
  }

  return data.map(screenshot => {
    const metadata = screenshot.metadata as { public_url?: string } | null;
    return {
      ...screenshot,
      public_url: metadata?.public_url || '',
    };
  });
}

/**
 * Delete a screenshot from both storage and database
 */
export async function deleteScreenshot(id: string, screenshotPath: string) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('ui-screenshots')
    .remove([screenshotPath]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    throw new Error(storageError.message || 'Failed to delete from storage');
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('ui_screenshots')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Database delete error:', dbError);
    throw new Error(dbError.message || 'Failed to delete from database');
  }
}