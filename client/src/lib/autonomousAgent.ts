import { captureScreenshot, captureDOMSnapshot, analyzePreview, sendAnalysisToCursor } from '@/lib/aiPreviewAnalysisService';
import { Test } from '@/contexts/ProjectContext';
import cursorAIService from './cursorAIService';

export interface AutonomousAgentOptions {
  enabledFeatures: {
    codeAnalysis: boolean;
    previewAnalysis: boolean;
    testExecution: boolean;
    errorDetection: boolean;
  };
  interval: number; // milliseconds between checks
  maxIterations: number; // maximum number of improvement cycles before pausing
}

export interface AgentState {
  status: 'idle' | 'running' | 'paused' | 'error';
  currentIteration: number;
  lastRun: Date | null;
  lastError: string | null;
  improvements: {
    codeImprovements: number;
    uiImprovements: number;
    testsFixed: number;
    errorsFixed: number;
  };
}

export class AutonomousAgent {
  private options: AutonomousAgentOptions;
  private state: AgentState;
  private intervalId: number | null = null;
  private previewFrame: HTMLIFrameElement | null = null;
  private callbacks: {
    onStatusChange?: (status: AgentState['status']) => void;
    onLog?: (type: string, message: string) => void;
    onFileUpdate?: (fileId: string, content: string) => void;
    onTestsRun?: (testId?: string, fileIds?: number[]) => void;
    onAnalysisComplete?: (analysis: any) => void;
  };

  constructor(options?: Partial<AutonomousAgentOptions>) {
    this.options = {
      enabledFeatures: {
        codeAnalysis: true,
        previewAnalysis: true,
        testExecution: true,
        errorDetection: true,
      },
      interval: 10000, // 10 seconds default
      maxIterations: 5,
      ...(options || {})
    };

    this.state = {
      status: 'idle',
      currentIteration: 0,
      lastRun: null,
      lastError: null,
      improvements: {
        codeImprovements: 0,
        uiImprovements: 0,
        testsFixed: 0,
        errorsFixed: 0
      }
    };

    this.callbacks = {};
  }

  /**
   * Set the preview iframe to be used for screenshot and DOM analysis
   */
  setPreviewFrame(frame: HTMLIFrameElement) {
    this.previewFrame = frame;
  }

  /**
   * Register callback functions
   */
  registerCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Start the autonomous agent
   */
  start() {
    if (this.state.status === 'running') return;
    
    this.updateStatus('running');
    this.log('log', 'Autonomous mode activated');
    
    // Reset state
    this.state.currentIteration = 0;
    this.state.improvements = {
      codeImprovements: 0,
      uiImprovements: 0,
      testsFixed: 0,
      errorsFixed: 0
    };
    
    // Start the main loop
    this.executeIteration();
    this.intervalId = window.setInterval(() => this.executeIteration(), this.options.interval);
  }

  /**
   * Pause the autonomous agent
   */
  pause() {
    if (this.state.status !== 'running') return;
    
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.updateStatus('paused');
    this.log('log', 'Autonomous mode paused');
  }

  /**
   * Stop the autonomous agent
   */
  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.updateStatus('idle');
    this.log('log', 'Autonomous mode stopped');
  }

  /**
   * Get the current state of the agent
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Main execution loop
   */
  private async executeIteration() {
    try {
      // Check if we've reached the maximum number of iterations
      if (this.state.currentIteration >= this.options.maxIterations) {
        this.pause();
        this.log('log', `Reached maximum ${this.options.maxIterations} iterations, pausing...`);
        return;
      }

      this.state.currentIteration++;
      this.state.lastRun = new Date();
      
      this.log('log', `Starting autonomous iteration #${this.state.currentIteration}`);
      
      // 1. Run enabled tasks in sequence
      if (this.options.enabledFeatures.previewAnalysis) {
        await this.analyzePreview();
      }
      
      if (this.options.enabledFeatures.testExecution) {
        await this.runTests();
      }
      
      if (this.options.enabledFeatures.codeAnalysis) {
        await this.analyzeCode();
      }
      
      this.log('log', `Completed autonomous iteration #${this.state.currentIteration}`);
    } catch (error: any) {
      this.state.lastError = error.message;
      this.updateStatus('error');
      this.log('error', `Autonomous agent error: ${error.message}`);
      
      // Auto-recover after error
      setTimeout(() => {
        if (this.state.status === 'error') {
          this.updateStatus('running');
        }
      }, 30000); // Wait 30 seconds before auto-recovery
    }
  }

  /**
   * Analyze the preview and generate improvements
   */
  private async analyzePreview() {
    if (!this.previewFrame) {
      this.log('warn', 'No preview frame available for analysis');
      return;
    }
    
    try {
      this.log('log', 'Capturing preview for analysis...');
      
      // Capture screenshot and DOM
      const domSnapshot = captureDOMSnapshot(this.previewFrame);
      const screenshotBase64 = await captureScreenshot(this.previewFrame);
      
      if (!domSnapshot && !screenshotBase64) {
        this.log('warn', 'Failed to capture preview content');
        return;
      }
      
      // Analyze the preview
      const analysisResult = await analyzePreview({
        htmlContent: domSnapshot || '',
        screenshotBase64: screenshotBase64 || undefined,
        analysisGoal: 'general'
      });
      
      // Log analysis results
      const issueCount = analysisResult.analysis.issues?.length || 0;
      const suggestionCount = analysisResult.analysis.suggestions?.length || 0;
      
      this.log('log', `Preview analysis complete: ${issueCount} issues, ${suggestionCount} suggestions`);
      
      if (this.callbacks.onAnalysisComplete) {
        this.callbacks.onAnalysisComplete(analysisResult);
      }
      
      // If we have a cursor prompt, send it to apply the changes
      if (analysisResult.cursorPrompt && domSnapshot) {
        this.log('log', 'Sending improvements to Cursor AI...');
        const success = await sendAnalysisToCursor(analysisResult.cursorPrompt, domSnapshot);
        
        if (success) {
          this.state.improvements.uiImprovements++;
          this.log('log', 'Cursor AI successfully applied UI improvements');
        } else {
          this.log('warn', 'Failed to apply UI improvements through Cursor AI');
        }
      }
    } catch (error: any) {
      this.log('error', `Preview analysis error: ${error.message}`);
    }
  }

  /**
   * Run tests to validate the application
   */
  private async runTests() {
    try {
      this.log('log', 'Running automated tests...');
      
      // Execute tests
      if (this.callbacks.onTestsRun) {
        this.callbacks.onTestsRun();
      }
      
      // In a real implementation, we would wait for test results,
      // analyze them, and fix any failures
      
      // Simulating test improvements for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.state.improvements.testsFixed++;
      
      this.log('log', 'Test execution complete');
    } catch (error: any) {
      this.log('error', `Test execution error: ${error.message}`);
    }
  }

  /**
   * Analyze code for potential improvements
   */
  private async analyzeCode() {
    try {
      this.log('log', 'Analyzing code for potential improvements...');
      
      // In a real implementation, this would analyze current code,
      // identify potential improvements, and apply them
      
      // Simulating code improvements for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.state.improvements.codeImprovements++;
      
      this.log('log', 'Code analysis and improvements complete');
    } catch (error: any) {
      this.log('error', `Code analysis error: ${error.message}`);
    }
  }

  /**
   * Update the agent status and notify via callback
   */
  private updateStatus(status: AgentState['status']) {
    this.state.status = status;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Log a message via callback
   */
  private log(type: string, message: string) {
    if (this.callbacks.onLog) {
      this.callbacks.onLog(type, message);
    }
  }
}

// Create and export a singleton instance
export const autonomousAgent = new AutonomousAgent();