import { apiRequest } from '@/lib/queryClient';
import html2canvas from 'html2canvas';

export interface PreviewAnalysisRequest {
  // For HTML preview
  htmlContent?: string;
  // For DOM-based analysis
  domSnapshot?: string;
  // For screenshot-based analysis
  screenshotBase64?: string;
  // Context about the active file
  fileType?: string;
  fileName?: string;
  // Additional context
  analysisGoal?: 'ui_improvement' | 'bug_detection' | 'accessibility' | 'performance' | 'general';
}

export interface PreviewAnalysisResponse {
  // Analysis from OpenAI
  analysis: {
    issues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      codeLocation?: string;
    }>;
    suggestions: Array<{
      description: string;
      priority: 'low' | 'medium' | 'high';
      codeSnippet?: string;
    }>;
    summary: string;
  };
  // Generated prompt for Cursor AI
  cursorPrompt: string;
}

/**
 * Captures the DOM structure of the preview iframe for analysis
 */
export function captureDOMSnapshot(iframe: HTMLIFrameElement): string | null {
  try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) return null;
    
    // Get serialized HTML content from iframe
    const serializedDOM = iframeDocument.documentElement.outerHTML;
    return serializedDOM;
  } catch (error) {
    console.error("Error capturing DOM snapshot:", error);
    return null;
  }
}

/**
 * Captures a screenshot of the preview iframe for analysis
 */
export async function captureScreenshot(iframe: HTMLIFrameElement): Promise<string | null> {
  try {
    // Use html2canvas library for capturing screenshot
    const canvas = await html2canvas(iframe);
    return canvas.toDataURL('image/png').split(',')[1]; // base64 without prefix
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    return null;
  }
}

/**
 * Analyzes the preview content using OpenAI and generates feedback
 */
export async function analyzePreview(
  data: PreviewAnalysisRequest
): Promise<PreviewAnalysisResponse> {
  try {
    const response = await apiRequest<PreviewAnalysisResponse>({
      method: 'POST',
      url: '/api/analyze-preview',
      data
    });
    
    return response;
  } catch (error) {
    console.error("Error analyzing preview:", error);
    throw new Error("Failed to analyze preview. Check console for details.");
  }
}

/**
 * Sends the analysis results to Cursor AI as a prompt
 */
export async function sendAnalysisToCursor(
  cursorPrompt: string,
  fileContent: string
): Promise<boolean> {
  try {
    const response = await apiRequest<{ success: boolean }>({
      method: 'POST',
      url: '/api/cursor/send-prompt',
      data: {
        prompt: cursorPrompt,
        context: fileContent
      }
    });
    
    return response.success;
  } catch (error) {
    console.error("Error sending analysis to Cursor:", error);
    return false;
  }
}