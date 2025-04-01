import html2canvas from 'html2canvas';
import { apiRequest } from './queryClient';
import cursorAIService from './cursorAIService';

export interface PreviewAnalysisRequest {
  htmlContent: string;
  screenshotBase64?: string;
  analysisGoal: 'general' | 'accessibility' | 'performance' | 'seo' | 'mobile';
}

export interface PreviewAnalysisResponse {
  analysis: {
    issues?: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestions: string[];
      element?: string;
    }>;
    suggestions?: Array<{
      title: string;
      description: string;
      code?: string;
    }>;
    summary?: string;
  };
  cursorPrompt?: string;
}

/**
 * Capture a screenshot of the provided iframe
 * @param iframe The iframe element to capture
 * @returns Base64 encoded string of the screenshot
 */
export async function captureScreenshot(iframe: HTMLIFrameElement): Promise<string | null> {
  try {
    if (!iframe || !iframe.contentDocument) {
      console.error('Invalid iframe or content document');
      return null;
    }

    const canvas = await html2canvas(iframe.contentDocument.body, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      // Use iframe's window for font computation
      windowWidth: iframe.contentWindow?.innerWidth || 1024,
      windowHeight: iframe.contentWindow?.innerHeight || 768,
      // Use document width for full capture
      width: iframe.contentDocument.body.scrollWidth,
      height: iframe.contentDocument.body.scrollHeight
    });

    const screenshot = canvas.toDataURL('image/png');
    return screenshot.split(',')[1]; // Remove the data URL prefix to get just the base64 data
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    return null;
  }
}

/**
 * Capture the DOM content of the provided iframe
 * @param iframe The iframe element
 * @returns The HTML content as a string
 */
export function captureDOMSnapshot(iframe: HTMLIFrameElement): string | null {
  try {
    if (!iframe || !iframe.contentDocument) {
      console.error('Invalid iframe or content document');
      return null;
    }

    return iframe.contentDocument.documentElement.outerHTML;
  } catch (error) {
    console.error('Failed to capture DOM snapshot:', error);
    return null;
  }
}

/**
 * Analyze the preview using OpenAI API
 * @param request Analysis request with HTML content and optional screenshot
 * @returns Analysis response with issues and suggestions
 */
export async function analyzePreview(request: PreviewAnalysisRequest): Promise<PreviewAnalysisResponse> {
  try {
    // Call the API endpoint
    const response = await apiRequest({
      method: 'POST',
      url: '/api/analyze-preview',
      data: request,
    });

    return response || {
      analysis: {
        summary: 'Failed to analyze preview',
        issues: [],
        suggestions: []
      }
    };
  } catch (error) {
    console.error('Failed to analyze preview:', error);
    
    // Return empty analysis in case of error
    return {
      analysis: {
        summary: 'Analysis failed due to an error',
        issues: [],
        suggestions: []
      }
    };
  }
}

/**
 * Send analysis-based improvements to Cursor AI
 * @param prompt The prompt to send to Cursor AI
 * @param htmlContent The HTML content for context
 * @returns Whether the operation was successful
 */
export async function sendAnalysisToCursor(prompt: string, htmlContent: string): Promise<boolean> {
  try {
    // Prepare a detailed prompt with the HTML context
    const fullPrompt = `
    I need your help improving the HTML/CSS/JS based on an automated analysis.
    
    Analysis recommendations:
    ${prompt}
    
    Current HTML content:
    \`\`\`html
    ${htmlContent}
    \`\`\`
    
    Please provide specific code changes that address these issues while maintaining the existing functionality.
    Format your response as clear steps, and include exact code snippets that should be replaced.
    `;
    
    // Send the enhanced prompt to Cursor AI
    const response = await cursorAIService.sendPrompt(fullPrompt, 'preview-analysis', '');
    
    return response.success;
  } catch (error) {
    console.error('Failed to send analysis to Cursor AI:', error);
    return false;
  }
}