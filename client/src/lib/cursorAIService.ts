import { useToast } from '@/hooks/use-toast';
import type { ToastAction } from '@/components/ui/toast';

// Interfaces for Cursor AI responses
export interface CursorAIResponse {
  success: boolean;
  error?: string;
  fileChanges?: {
    fileId: string;
    content: string;
  };
  suggestions?: string[];
  codeSnippet?: string;
  detailedAnalysis?: string;
}

export interface CursorPromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  fileId?: string;
  fileContext?: string;
  result?: {
    success: boolean;
    responseSnippet: string;
    generatedCode?: string;
  };
}

// Interface for Cursor API interaction
export interface CursorAPIOptions {
  apiKey?: string;         // Cursor API Key
  endpoint?: string;       // API endpoint
  model?: string;          // AI model to use 
  includeMetadata?: boolean; // Whether to include file metadata
}

// Interface for Cursor Editor Communication
export interface CursorEditorOptions {
  host?: string;           // Editor host address
  port?: number;           // Editor port number
  secure?: boolean;        // Whether to use secure connection
  timeout?: number;        // Connection timeout in ms
}

// AI Manager learning patterns - stores successful prompt patterns
class AILearningEngine {
  private promptPatterns: Map<string, number> = new Map(); // pattern -> success count
  private contextualSuccess: Map<string, number> = new Map(); // context -> success count
  private userFeedback: Map<string, {positive: number, negative: number}> = new Map();
  private promptHistory: CursorPromptHistoryItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const patterns = localStorage.getItem('ai_prompt_patterns');
      const contexts = localStorage.getItem('ai_contextual_success');
      const feedback = localStorage.getItem('ai_user_feedback');
      const history = localStorage.getItem('ai_prompt_history');

      if (patterns) this.promptPatterns = new Map(JSON.parse(patterns));
      if (contexts) this.contextualSuccess = new Map(JSON.parse(contexts));
      if (feedback) this.userFeedback = new Map(JSON.parse(feedback));
      if (history) this.promptHistory = JSON.parse(history);
    } catch (error) {
      console.error('Error loading AI learning data:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('ai_prompt_patterns', JSON.stringify(Array.from(this.promptPatterns.entries())));
      localStorage.setItem('ai_contextual_success', JSON.stringify(Array.from(this.contextualSuccess.entries())));
      localStorage.setItem('ai_user_feedback', JSON.stringify(Array.from(this.userFeedback.entries())));
      localStorage.setItem('ai_prompt_history', JSON.stringify(this.promptHistory.slice(-50))); // Keep last 50 prompts
    } catch (error) {
      console.error('Error saving AI learning data:', error);
    }
  }

  // Record successful pattern
  recordSuccess(prompt: string, fileContext: string) {
    // Extract patterns from the prompt (simplistic version)
    const keywords = this.extractKeywords(prompt);
    
    keywords.forEach(keyword => {
      const current = this.promptPatterns.get(keyword) || 0;
      this.promptPatterns.set(keyword, current + 1);
    });

    // Record contextual success
    const contextKey = this.getContextKey(fileContext);
    const contextCount = this.contextualSuccess.get(contextKey) || 0;
    this.contextualSuccess.set(contextKey, contextCount + 1);

    this.saveToLocalStorage();
  }

  // Record a prompt and its result
  recordPrompt(prompt: string, fileId?: string, fileContext?: string, result?: { 
    success: boolean, 
    responseSnippet: string,
    generatedCode?: string
  }) {
    const promptItem: CursorPromptHistoryItem = {
      id: Date.now().toString(),
      prompt,
      timestamp: new Date(),
      fileId,
      fileContext,
      result
    };

    this.promptHistory = [...this.promptHistory, promptItem];
    
    // Keep only the last 50 prompts to avoid excessive storage use
    if (this.promptHistory.length > 50) {
      this.promptHistory = this.promptHistory.slice(-50);
    }

    this.saveToLocalStorage();
  }

  // Record user feedback on a prompt
  recordFeedback(promptId: string, isPositive: boolean) {
    const feedback = this.userFeedback.get(promptId) || { positive: 0, negative: 0 };
    
    if (isPositive) {
      feedback.positive += 1;
    } else {
      feedback.negative += 1;
    }

    this.userFeedback.set(promptId, feedback);
    this.saveToLocalStorage();
  }

  // Get optimized prompt suggestions based on the current context
  getSuggestions(currentContext: string, promptIntent: string): string[] {
    const suggestions: string[] = [];
    const contextKey = this.getContextKey(currentContext);
    
    // Get top successful patterns
    const sortedPatterns = Array.from(this.promptPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Generate suggestions based on intent and successful patterns
    if (promptIntent.includes('fix') || promptIntent.includes('debug')) {
      suggestions.push(`Fix the issues in this code: ${sortedPatterns.slice(0, 2).join(', ')}`);
      suggestions.push(`Identify and resolve all bugs related to ${sortedPatterns[0] || 'functionality'}`);
    } else if (promptIntent.includes('implement') || promptIntent.includes('create')) {
      suggestions.push(`Implement a ${sortedPatterns[0] || 'function'} that handles ${promptIntent.split(' ').slice(-1)[0]}`);
      suggestions.push(`Create a complete implementation for this feature following best practices`);
    } else if (promptIntent.includes('optimize') || promptIntent.includes('improve')) {
      suggestions.push(`Optimize this code for better performance and readability`);
      suggestions.push(`Improve the ${sortedPatterns[0] || 'code'} structure while maintaining functionality`);
    } else if (promptIntent.includes('explain')) {
      suggestions.push(`Explain how this code works and identify any potential issues`);
    } else {
      suggestions.push(`Complete the implementation for the current functionality`);
      suggestions.push(`Suggest improvements for this code block`);
    }

    return suggestions;
  }

  // Get prompt history
  getPromptHistory(): CursorPromptHistoryItem[] {
    return this.promptHistory;
  }

  // Get similar successful prompts from history
  getSimilarSuccessfulPrompts(currentPrompt: string): CursorPromptHistoryItem[] {
    const keywords = this.extractKeywords(currentPrompt);
    
    return this.promptHistory
      .filter(item => item.result?.success && 
        keywords.some(keyword => 
          item.prompt.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      .slice(-3); // Return the 3 most recent matches
  }

  // Extract keywords for pattern analysis
  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'and', 'is', 'in', 'to', 'a', 'for', 'of', 'with', 'on', 'this'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5); // Take top 5 keywords
  }

  // Get context key for storage
  private getContextKey(context: string): string {
    return context.substring(0, 100).replace(/\s+/g, ' ').trim();
  }
}

// Class that handles direct integration with Cursor Editor
export class CursorEditorConnector {
  private editorConnection: WebSocket | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private messageQueue: any[] = [];
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private options: CursorEditorOptions;
  private apiKey: string | null = null;

  constructor(options: CursorEditorOptions = {}) {
    this.options = {
      host: options.host || 'localhost',
      port: options.port || 9999, // Default Cursor Editor port
      secure: options.secure || false,
      timeout: options.timeout || 5000
    };
  }

  // Set API key for Cursor API
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Connect to Cursor Editor
  async connect(): Promise<boolean> {
    if (this.connected && this.editorConnection && this.editorConnection.readyState === WebSocket.OPEN) {
      return true;
    }

    if (this.connecting) {
      return new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.connected) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, this.options.timeout || 5000);
      });
    }

    try {
      this.connecting = true;
      const protocol = this.options.secure ? 'wss' : 'ws';
      const url = `${protocol}://${this.options.host}:${this.options.port}/editor`;
      
      console.log(`Connecting to Cursor Editor at ${url}`);
      this.editorConnection = new WebSocket(url);
      
      return new Promise<boolean>((resolve) => {
        if (!this.editorConnection) {
          this.connecting = false;
          resolve(false);
          return;
        }
        
        this.editorConnection.onopen = () => {
          console.log('Connected to Cursor Editor');
          this.connected = true;
          this.connecting = false;
          
          // Process message queue
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) this.sendToEditor(message);
          }
          
          // Authenticate if we have an API key
          if (this.apiKey) {
            this.sendToEditor({
              type: 'authenticate',
              apiKey: this.apiKey
            });
          }
          
          resolve(true);
        };
        
        this.editorConnection.onclose = () => {
          console.log('Disconnected from Cursor Editor');
          this.connected = false;
          this.connecting = false;
          this.editorConnection = null;
        };
        
        this.editorConnection.onerror = (error) => {
          console.error('Cursor Editor connection error:', error);
          this.connecting = false;
          resolve(false);
        };
        
        this.editorConnection.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleEditorMessage(message);
          } catch (error) {
            console.error('Error parsing message from Cursor Editor:', error);
          }
        };
        
        setTimeout(() => {
          if (this.connecting) {
            this.connecting = false;
            resolve(false);
          }
        }, this.options.timeout || 5000);
      });
    } catch (error) {
      console.error('Error connecting to Cursor Editor:', error);
      this.connecting = false;
      return false;
    }
  }
  
  // Send a message to the Cursor Editor
  sendToEditor(message: any): boolean {
    if (this.connected && this.editorConnection && this.editorConnection.readyState === WebSocket.OPEN) {
      this.editorConnection.send(JSON.stringify(message));
      return true;
    } else {
      // Queue the message for when we're connected
      this.messageQueue.push(message);
      return false;
    }
  }
  
  // Handle messages from the Cursor Editor
  private handleEditorMessage(message: any) {
    const { type, id } = message;
    
    // Check if we have a handler registered for this message ID
    if (id && this.messageHandlers.has(id)) {
      const handler = this.messageHandlers.get(id);
      if (handler) {
        handler(message);
        this.messageHandlers.delete(id);
      }
    }
    
    // Also handle message types
    switch (type) {
      case 'authenticated':
        console.log('Successfully authenticated with Cursor Editor');
        break;
      case 'error':
        console.error('Cursor Editor error:', message.error);
        break;
    }
  }
  
  // Send a prompt to Cursor AI via the editor
  async sendPrompt(prompt: string, filePath: string): Promise<any> {
    const messageId = Date.now().toString();
    
    if (!await this.connect()) {
      throw new Error('Failed to connect to Cursor Editor');
    }
    
    const message = {
      id: messageId,
      type: 'prompt',
      prompt,
      filePath
    };
    
    this.sendToEditor(message);
    
    // Wait for response
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(new Error('Timeout waiting for Cursor Editor response'));
      }, this.options.timeout || 30000);
      
      this.messageHandlers.set(messageId, (response) => {
        clearTimeout(timeoutId);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  // Get open files in Cursor Editor
  async getOpenFiles(): Promise<string[]> {
    const messageId = Date.now().toString();
    
    if (!await this.connect()) {
      throw new Error('Failed to connect to Cursor Editor');
    }
    
    const message = {
      id: messageId,
      type: 'getOpenFiles'
    };
    
    this.sendToEditor(message);
    
    // Wait for response
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(new Error('Timeout waiting for Cursor Editor response'));
      }, this.options.timeout || 5000);
      
      this.messageHandlers.set(messageId, (response) => {
        clearTimeout(timeoutId);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.files || []);
        }
      });
    });
  }
  
  // Get content of a file in Cursor Editor
  async getFileContent(filePath: string): Promise<string> {
    const messageId = Date.now().toString();
    
    if (!await this.connect()) {
      throw new Error('Failed to connect to Cursor Editor');
    }
    
    const message = {
      id: messageId,
      type: 'getFileContent',
      filePath
    };
    
    this.sendToEditor(message);
    
    // Wait for response
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(new Error('Timeout waiting for Cursor Editor response'));
      }, this.options.timeout || 5000);
      
      this.messageHandlers.set(messageId, (response) => {
        clearTimeout(timeoutId);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.content || '');
        }
      });
    });
  }
  
  // Apply changes to a file in Cursor Editor
  async applyChanges(filePath: string, changes: {range: {start: {line: number, character: number}, end: {line: number, character: number}}, newText: string}[]): Promise<boolean> {
    const messageId = Date.now().toString();
    
    if (!await this.connect()) {
      throw new Error('Failed to connect to Cursor Editor');
    }
    
    const message = {
      id: messageId,
      type: 'applyChanges',
      filePath,
      changes
    };
    
    this.sendToEditor(message);
    
    // Wait for response
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(new Error('Timeout waiting for Cursor Editor response'));
      }, this.options.timeout || 5000);
      
      this.messageHandlers.set(messageId, (response) => {
        clearTimeout(timeoutId);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.success || false);
        }
      });
    });
  }
}

// Class for managing Cursor AI integration
export class CursorAIService {
  private wsConnection: WebSocket | null = null;
  private learningEngine: AILearningEngine;
  private connecting: boolean = false;
  private messageQueue: any[] = [];
  private toast: { toast: (args: any) => void };
  private cursorEditor: CursorEditorConnector | null = null;

  constructor() {
    this.learningEngine = new AILearningEngine();
    this.toast = { toast: () => {} }; // Default empty toast function
    
    // Initialize Cursor Editor connector if running in a dev environment
    if (import.meta.env.DEV) {
      this.initCursorEditor();
    }
  }
  
  // Initialize Cursor Editor connector
  private initCursorEditor() {
    this.cursorEditor = new CursorEditorConnector({
      host: 'localhost',
      port: 9999
    });
    
    // Check for API key in environment
    const apiKey = import.meta.env.VITE_CURSOR_API_KEY;
    if (apiKey) {
      this.cursorEditor.setApiKey(apiKey);
    }
  }

  // Initialize with toast provider
  initToast(toastProvider: any) {
    this.toast = toastProvider;
  }

  // Connect to WebSocket
  async connect(): Promise<boolean> {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      return true; // Already connected
    }

    if (this.connecting) {
      return new Promise<boolean>((resolve) => {
        // Check every 100ms if connection established
        const checkInterval = setInterval(() => {
          if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, 5000);
      });
    }

    try {
      this.connecting = true;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log("Connecting to WebSocket at:", wsUrl);

      try {
        this.wsConnection = new WebSocket(wsUrl);
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        this.connecting = false;
        return false;
      }

      return new Promise<boolean>((resolve) => {
        if (!this.wsConnection) {
          this.connecting = false;
          resolve(false);
          return;
        }

        this.wsConnection.onopen = () => {
          console.log("WebSocket connection established");
          this.connecting = false;
          
          // Send any queued messages
          while (this.messageQueue.length > 0) {
            const queuedMessage = this.messageQueue.shift();
            if (queuedMessage && this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
              try {
                this.wsConnection.send(JSON.stringify(queuedMessage));
              } catch (err) {
                console.error("Error sending queued message:", err);
              }
            }
          }
          
          resolve(true);
        };

        this.wsConnection.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
          this.wsConnection = null;
          this.connecting = false;
        };

        this.wsConnection.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.connecting = false;
          resolve(false);
        };

        // Use try-catch when binding the message handler
        try {
          this.wsConnection.onmessage = this.handleWebSocketMessage.bind(this);
        } catch (err) {
          console.error("Error binding message handler:", err);
        }

        // Set a timeout in case the connection hangs
        setTimeout(() => {
          if (this.connecting) {
            this.connecting = false;
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error("Error establishing WebSocket connection:", error);
      this.connecting = false;
      return false;
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === 'cursorResponse') {
        // Cursor AI response
        this.handleCursorResponse(data);
      } else if (data.type === 'codeAnalysis') {
        // Code analysis result
        this.handleCodeAnalysis(data);
      } else if (data.type === 'testResult') {
        // Test result
        this.handleTestResult(data);
      } else if (data.type === 'error') {
        // Error
        console.error("WebSocket error:", data.message);
        this.toast.toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        } as any);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  // Send prompt to Cursor AI
  async sendPrompt(prompt: string, fileId: string, fileContent: string): Promise<CursorAIResponse> {
    try {
      // Record the prompt for learning and history
      this.learningEngine.recordPrompt(prompt, fileId, fileContent);
      
      // First try to use Cursor Editor if available
      if (this.cursorEditor) {
        try {
          console.log("Attempting to use Cursor Editor integration");
          
          // Try to connect to the Cursor Editor
          const editorConnected = await this.cursorEditor.connect();
          if (editorConnected) {
            // We have a connection to the actual Cursor Editor!
            // Let's extract a file path from our file ID (this would be implementation-specific)
            const filePath = `file-${fileId}.ts`; // This would need to be mapped to actual file path
            
            try {
              // Send the prompt to the Cursor Editor
              console.log(`Sending prompt to Cursor Editor for file: ${filePath}`);
              const editorResponse = await this.cursorEditor.sendPrompt(prompt, filePath);
              
              // Process the editor response
              console.log("Received response from Cursor Editor:", editorResponse);
              
              // Record successful interaction
              this.learningEngine.recordSuccess(prompt, fileContent);
              this.learningEngine.recordPrompt(prompt, fileId, fileContent, {
                success: true,
                responseSnippet: editorResponse.message || "Successfully processed by Cursor AI",
                generatedCode: editorResponse.codeChanges || ""
              });
              
              // Format the response to match our expected interface
              return {
                success: true,
                suggestions: editorResponse.suggestions || [],
                codeSnippet: editorResponse.codeChanges || "",
                detailedAnalysis: editorResponse.explanation || "",
                fileChanges: editorResponse.fileChanges ? {
                  fileId,
                  content: editorResponse.fileChanges
                } : undefined
              };
            } catch (editorError: any) {
              console.warn("Cursor Editor prompt failed:", editorError.message);
              // Fall back to our server implementation
            }
          } else {
            console.log("Could not connect to Cursor Editor, falling back to server implementation");
          }
        } catch (editorConnectError) {
          console.warn("Failed to connect to Cursor Editor:", editorConnectError);
          // Fall back to our server implementation
        }
      }
      
      // If Cursor Editor is not available or failed, use our server implementation
      console.log("Using server implementation for AI processing");
      
      // Connect to WebSocket if not connected
      const connected = await this.connect();
      if (!connected) {
        throw new Error("Failed to connect to WebSocket");
      }

      // Send prompt to server
      const message = {
        type: 'cursorPrompt',
        prompt,
        fileId
      };

      // If connected, send immediately; otherwise, queue the message
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify(message));
      } else {
        this.messageQueue.push(message);
      }

      // Return a promise that resolves when we receive a response
      return new Promise<CursorAIResponse>((resolve, reject) => {
        if (!this.wsConnection) {
          reject(new Error("WebSocket connection not established"));
          return;
        }

        // Set up a one-time message handler for this prompt
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            // If this is the response to our prompt
            if (data.type === 'cursorResponse') {
              // Clean up
              if (this.wsConnection) {
                this.wsConnection.removeEventListener('message', messageHandler);
              }
              
              if (data.success) {
                // Record successful pattern
                this.learningEngine.recordSuccess(prompt, fileContent);
                
                // Update the prompt in history with the result
                this.learningEngine.recordPrompt(prompt, fileId, fileContent, {
                  success: true,
                  responseSnippet: data.data.response,
                  generatedCode: data.data.codeSnippet
                });
                
                resolve({
                  success: true,
                  fileChanges: data.data.fileChanges,
                  suggestions: data.data.suggestions,
                  codeSnippet: data.data.codeSnippet,
                  detailedAnalysis: data.data.detailedAnalysis
                });
              } else {
                // Update history with failure
                this.learningEngine.recordPrompt(prompt, fileId, fileContent, {
                  success: false,
                  responseSnippet: data.error || "Unknown error"
                });
                
                reject(new Error(data.error || "Unknown error"));
              }
            } else if (data.type === 'error') {
              // Clean up
              if (this.wsConnection) {
                this.wsConnection.removeEventListener('message', messageHandler);
              }
              
              // Update history with failure
              this.learningEngine.recordPrompt(prompt, fileId, fileContent, {
                success: false,
                responseSnippet: data.message || "Unknown error"
              });
              
              reject(new Error(data.message));
            }
          } catch (error) {
            console.error("Error handling prompt response:", error);
          }
        };

        // Add the temporary message handler
        this.wsConnection.addEventListener('message', messageHandler);

        // Set a timeout to prevent hanging
        setTimeout(() => {
          if (this.wsConnection) {
            this.wsConnection.removeEventListener('message', messageHandler);
          }
          reject(new Error("Request timed out"));
        }, 30000); // 30 second timeout
      });
    } catch (error: any) {
      console.error("Error sending prompt to Cursor AI:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Run tests
  async runTests(testId?: string, fileIds?: number[]): Promise<any> {
    try {
      // Connect to WebSocket if not connected
      const connected = await this.connect();
      if (!connected) {
        throw new Error("Failed to connect to WebSocket");
      }

      // Create message
      const message = {
        type: 'runTest',
        testId,
        fileIds: fileIds || []
      };

      // If connected, send immediately; otherwise, queue the message
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify(message));
      } else {
        this.messageQueue.push(message);
      }

      // Return a promise that resolves when we receive a response
      return new Promise<any>((resolve, reject) => {
        if (!this.wsConnection) {
          reject(new Error("WebSocket connection not established"));
          return;
        }

        // Set up a one-time message handler for this test run
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            // If this is the response to our test run
            if (data.type === 'testResult') {
              // Clean up
              if (this.wsConnection) {
                this.wsConnection.removeEventListener('message', messageHandler);
              }
              
              if (data.success) {
                resolve(data.data);
              } else {
                reject(new Error(data.error || "Unknown error"));
              }
            } else if (data.type === 'error') {
              // Clean up
              if (this.wsConnection) {
                this.wsConnection.removeEventListener('message', messageHandler);
              }
              
              reject(new Error(data.message));
            }
          } catch (error) {
            console.error("Error handling test response:", error);
          }
        };

        // Add the temporary message handler
        this.wsConnection.addEventListener('message', messageHandler);

        // Set a timeout to prevent hanging
        setTimeout(() => {
          if (this.wsConnection) {
            this.wsConnection.removeEventListener('message', messageHandler);
          }
          reject(new Error("Request timed out"));
        }, 30000); // 30 second timeout
      });
    } catch (error: any) {
      console.error("Error running tests:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update code with error detection
  async updateCode(fileId: string, content: string): Promise<any> {
    try {
      // Connect to WebSocket if not connected
      const connected = await this.connect();
      if (!connected) {
        throw new Error("Failed to connect to WebSocket");
      }

      // Create message
      const message = {
        type: 'updateCode',
        fileId,
        content
      };

      // If connected, send immediately; otherwise, queue the message
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify(message));
      } else {
        this.messageQueue.push(message);
      }

      // Return a promise that resolves when we receive a response
      return new Promise<any>((resolve, reject) => {
        if (!this.wsConnection) {
          reject(new Error("WebSocket connection not established"));
          return;
        }

        // Set up a one-time message handler for this code update
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            // If this is the response to our code update
            if (data.type === 'codeAnalysis') {
              // Clean up
              if (this.wsConnection) {
                this.wsConnection.removeEventListener('message', messageHandler);
              }
              
              if (data.success) {
                resolve(data.data);
              } else {
                reject(new Error(data.error || "Unknown error"));
              }
            } else if (data.type === 'error') {
              // Clean up
              if (this.wsConnection) {
                this.wsConnection.removeEventListener('message', messageHandler);
              }
              
              reject(new Error(data.message));
            }
          } catch (error) {
            console.error("Error handling code update response:", error);
          }
        };

        // Add the temporary message handler
        this.wsConnection.addEventListener('message', messageHandler);

        // Set a timeout to prevent hanging
        setTimeout(() => {
          if (this.wsConnection) {
            this.wsConnection.removeEventListener('message', messageHandler);
          }
          reject(new Error("Request timed out"));
        }, 30000); // 30 second timeout
      });
    } catch (error: any) {
      console.error("Error updating code:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get prompt suggestions based on learning
  getSuggestions(currentContext: string, promptIntent: string): string[] {
    return this.learningEngine.getSuggestions(currentContext, promptIntent);
  }

  // Get prompt history
  getPromptHistory(): CursorPromptHistoryItem[] {
    return this.learningEngine.getPromptHistory();
  }

  // Get similar successful prompts
  getSimilarPrompts(currentPrompt: string): CursorPromptHistoryItem[] {
    return this.learningEngine.getSimilarSuccessfulPrompts(currentPrompt);
  }

  // Record feedback on a prompt
  recordFeedback(promptId: string, isPositive: boolean): void {
    this.learningEngine.recordFeedback(promptId, isPositive);
  }

  // Handle cursor AI response from WebSocket
  private handleCursorResponse(data: any) {
    if (data.success) {
      this.toast.toast({
        title: "Cursor AI Response",
        description: data.data.response,
        className: "border-l-4 border-green-500",
      } as any);
    }
  }

  // Handle code analysis from WebSocket
  private handleCodeAnalysis(data: any) {
    if (data.success && data.data.issues && data.data.issues.length > 0) {
      this.toast.toast({
        title: "Code Analysis",
        description: `Found ${data.data.issues.length} issue(s) in your code.`,
        className: "border-l-4 border-amber-500",
      } as any);
    }
  }

  // Handle test result from WebSocket
  private handleTestResult(data: any) {
    if (data.success) {
      this.toast.toast({
        title: "Test Results",
        description: data.data.passed 
          ? "Tests passed successfully!" 
          : "Some tests failed. Check the testing panel for details.",
        className: data.data.passed 
          ? "border-l-4 border-green-500" 
          : "border-l-4 border-red-500",
      } as any);
    }
  }
}

// Create a single instance for the application
const cursorAIService = new CursorAIService();

// The singleton should be initialized by components directly
// cursorAIService.initToast(useToast());

// Export the singleton
export default cursorAIService;