import { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import cursorAIService, { CursorEditorConnector } from '@/lib/cursorAIService';
import { autonomousAgent } from '@/lib/autonomousAgent';

interface User {
  id: string;
  name: string;
  initials: string;
}

interface Project {
  id: string;
  name: string;
}

interface File {
  id: string;
  name: string;
  type: string;
  content: string;
}

interface Log {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: string;
  fileId: string;
  line?: number;
}

export interface Test {
  id: string;
  name: string;
  script: string;
  status: 'not_run' | 'running' | 'passed' | 'failed';
  result: string | null;
  fileId: string;
  details?: {
    coverage?: number;
    executionTime?: number;
    assertions?: Array<{
      name: string;
      status: 'passed' | 'failed';
    }>;
  };
}

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
}

interface ProjectContextType {
  user: User;
  projects: Project[];
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  
  files: File[];
  activeFile: File;
  setActiveFile: (file: File) => void;
  updateFileContent: (fileId: string, content: string) => void;
  
  logs: Log[];
  addLog: (type: string, message: string) => void;
  clearLogs: () => void;
  
  issues: Issue[];
  
  tests: Test[];
  runTests: (testId?: string, fileIdsParam?: number[]) => void;
  addTest: (test: Test) => void;
  
  gitStatus: GitStatus;
  commitChanges: (message: string) => void;
  rollbackChanges: () => void;
  branches: string[];
  currentBranch: string;
  switchBranch: (branch: string) => void;
  
  sendPromptToCursor: (prompt: string) => void;
  cursorStatus: string;
  
  // Cursor AI Configuration
  setCursorAPIKey: (apiKey: string) => void;
  connectToCursorEditor: (options: { host: string, port: number }) => Promise<boolean>;
  isCursorEditorConnected: boolean;
  
  // Background automation
  isAutonomousMode: boolean;
  toggleAutonomousMode: () => void;
  autonomousStatus: 'idle' | 'running' | 'paused' | 'error';
  
  appVersion: string;
}

export const ProjectContext = createContext<ProjectContextType>({
  user: { id: '1', name: 'John Doe', initials: 'JD' },
  projects: [],
  activeProject: { id: '1', name: 'My Web App' },
  setActiveProject: () => {},
  
  files: [],
  activeFile: { id: '1', name: '', type: '', content: '' },
  setActiveFile: () => {},
  updateFileContent: () => {},
  
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
  
  issues: [],
  
  tests: [],
  runTests: () => {},
  addTest: () => {},
  
  gitStatus: { modified: [], staged: [], untracked: [] },
  commitChanges: () => {},
  rollbackChanges: () => {},
  branches: [],
  currentBranch: 'main',
  switchBranch: () => {},
  
  sendPromptToCursor: () => {},
  cursorStatus: 'Ready',
  
  // Cursor AI Configuration
  setCursorAPIKey: () => {},
  connectToCursorEditor: async () => false,
  isCursorEditorConnected: false,
  
  // Background automation
  isAutonomousMode: false,
  toggleAutonomousMode: () => {},
  autonomousStatus: 'idle',
  
  appVersion: 'v1.0.0'
});

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const { toast } = useToast();
  
  // User
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    initials: 'JD'
  });
  
  // Projects
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'My Web App' },
    { id: '2', name: 'E-commerce Site' },
    { id: '3', name: 'Portfolio' }
  ]);
  const [activeProject, setActiveProject] = useState<Project>(projects[0]);
  
  // Files
  const [files, setFiles] = useState<File[]>([
    {
      id: '1',
      name: 'index.html',
      type: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form</title>
</head>
<body>
  <div class="container">
    <h2>Contact Us</h2>
    <form id="contactForm">
      <div>
        <label for="name">Name</label>
        <input id="name" type="text" placeholder="Your name">
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" type="email" placeholder="your.email@example.com">
      </div>
      <div id="errorMessage" style="display: none; color: red;"></div>
      <button type="submit">Submit</button>
    </form>
  </div>
  <script src="app.js"></script>
</body>
</html>`
    },
    {
      id: '2',
      name: 'styles.css',
      type: 'css',
      content: `.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 15px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3367d6;
}`
    },
    {
      id: '3',
      name: 'app.js',
      type: 'js',
      content: `// Main application code
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    
    if (!validateEmail(email)) {
      console.error('Invalid email format');
      showError('Please enter a valid email address.');
      return;
    }
    
    submitForm({ name, email });
  });
  
  function validateEmail(email) {
    const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return re.test(email);
  }
  
  function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  function submitForm(data) {
    // Implementation missing
    console.log('Submitting form:', data);
  }
});`
    },
    {
      id: '4',
      name: 'components',
      type: 'folder',
      content: ''
    }
  ]);
  const [activeFile, setActiveFile] = useState<File>(files[2]); // app.js is active by default
  
  const updateFileContent = (fileId: string, content: string) => {
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, content } : file
    ));
    
    // Find issues in the modified code
    setTimeout(() => {
      analyzeCode(fileId, content);
    }, 500);
  };
  
  // Console logs
  const [logs, setLogs] = useState<Log[]>([
    { id: '1', type: 'log', message: 'Page loaded', timestamp: new Date() },
    { id: '2', type: 'log', message: 'Submitting form: {name: "John", email: "john@example"}', timestamp: new Date() },
    { id: '3', type: 'error', message: 'Error: Invalid email format', timestamp: new Date() }
  ]);
  
  const addLog = (type: string, message: string) => {
    const newLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
    
    // If it's an error, analyze it for issue detection
    if (type === 'error') {
      analyzeError(message);
    }
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Issues
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: '1',
      title: 'Missing Implementation',
      description: 'The submitForm function is declared but missing implementation.',
      severity: 'high',
      fileId: '3'
    },
    {
      id: '2',
      title: 'Email Validation',
      description: 'Email validation regex could be improved for better accuracy.',
      severity: 'medium',
      fileId: '3'
    }
  ]);
  
  const analyzeCode = (fileId: string, content: string) => {
    // Simple code analysis for demonstration
    const newIssues: Issue[] = [];
    
    // Check for missing implementation in JS files
    if (files.find(f => f.id === fileId)?.type === 'js') {
      if (content.includes('// Implementation missing') || content.includes('// TODO:')) {
        newIssues.push({
          id: Date.now().toString(),
          title: 'Missing Implementation',
          description: 'There is code marked as missing implementation or TODO.',
          severity: 'high',
          fileId
        });
      }
      
      // Check for console.log statements (which may be used for debugging)
      if (content.includes('console.log(')) {
        newIssues.push({
          id: Date.now().toString() + '1',
          title: 'Debug Code',
          description: 'Console.log statements should be removed in production code.',
          severity: 'low',
          fileId
        });
      }
    }
    
    // Update issues (preserving those for other files)
    setIssues(prevIssues => {
      const filteredIssues = prevIssues.filter(issue => issue.fileId !== fileId);
      return [...filteredIssues, ...newIssues];
    });
  };
  
  const analyzeError = (errorMessage: string) => {
    // Example error analysis
    if (errorMessage.includes('Invalid email format')) {
      // Check if we already have this issue
      if (!issues.some(issue => issue.title === 'Email Validation')) {
        setIssues(prevIssues => [...prevIssues, {
          id: Date.now().toString(),
          title: 'Email Validation',
          description: 'Email validation is failing. Consider improving the validation logic.',
          severity: 'medium',
          fileId: '3' // Assume it's from app.js
        }]);
      }
    }
  };
  
  // Tests
  const [tests, setTests] = useState<Test[]>([
    {
      id: '1',
      name: 'Form Submission',
      script: `test("Form submits with valid inputs", () => {
  document.getElementById('name').value = 'Test User';
  document.getElementById('email').value = 'test@example.com';
  document.getElementById('contactForm').submit();
  expect(console.log).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test User',
    email: 'test@example.com'
  }));
});`,
      status: 'not_run',
      result: null,
      fileId: '3'  // app.js
    }
  ]);
  
  const addTest = (test: Test) => {
    setTests(prevTests => [...prevTests, test]);
  };
  
  const runTests = async (testIdParam?: string, fileIdsParam?: number[]) => {
    try {
      let testId: number | undefined = testIdParam ? parseInt(testIdParam) : undefined;
      let fileIds: number[] = fileIdsParam || 
        (activeFile.type !== 'folder' ? [parseInt(activeFile.id)] : []);
      
      // Update tests to 'running' state
      if (testId) {
        // Mark specific test as running
        setTests(prevTests => prevTests.map(test => 
          test.id === testIdParam ? { ...test, status: 'running', result: null } : test
        ));
      } else if (fileIds.length > 0) {
        // Mark tests for the specified files as running
        setTests(prevTests => prevTests.map(test => 
          fileIds.includes(parseInt(test.fileId)) 
            ? { ...test, status: 'running', result: null } 
            : test
        ));
      }
      
      // Create WebSocket message
      const message = {
        type: 'runTest',
        testId,
        fileIds
      };
      
      // Send message through WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      // Wait for socket to be ready
      if (socket.readyState !== WebSocket.OPEN) {
        await new Promise<void>((resolve) => {
          socket.onopen = () => resolve();
          // Add timeout to prevent hanging
          setTimeout(() => resolve(), 3000);
        });
      }
      
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        addLog('log', `Test execution requested ${testId ? 'for specific test' : 'for multiple files'}`);
      } else {
        throw new Error('WebSocket connection failed');
      }
      
      // Clean up socket after a while
      setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }, 5000);
    } catch (error: any) {
      console.error('Error running tests:', error);
      addLog('error', `Failed to run tests: ${error.message}`);
      
      // Reset test status if there's an error
      if (testIdParam) {
        setTests(prevTests => prevTests.map(test => 
          test.id === testIdParam && test.status === 'running' 
            ? { ...test, status: 'not_run', result: 'Failed to run test' } 
            : test
        ));
      }
      
      toast({
        title: "Test Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Git status
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    modified: ['app.js'],
    staged: [],
    untracked: []
  });
  
  const [branches, setBranches] = useState<string[]>(['main', 'develop', 'feature/form-validation']);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  
  const commitChanges = (message: string) => {
    // Simulate committing changes
    setGitStatus({
      modified: [],
      staged: [],
      untracked: []
    });
    
    // Add a success log
    addLog('log', `Changes committed: ${message}`);
  };
  
  const rollbackChanges = () => {
    // Simulate rolling back changes
    const originalFile = files.find(f => f.id === '3'); // app.js
    if (originalFile) {
      updateFileContent('3', originalFile.content);
    }
    
    setGitStatus({
      modified: [],
      staged: [],
      untracked: []
    });
    
    // Add a log
    addLog('log', 'Changes rolled back to last commit');
  };
  
  const switchBranch = (branch: string) => {
    setCurrentBranch(branch);
    // In a real app, this would load different content from the branch
    addLog('log', `Switched to branch: ${branch}`);
  };
  
  // Cursor AI integration
  const [cursorStatus, setCursorStatus] = useState<string>('Ready');
  const [isCursorEditorConnected, setIsCursorEditorConnected] = useState<boolean>(false);
  const appVersion = 'v1.0.0';
  
  // Autonomous mode for background operations
  const [isAutonomousMode, setIsAutonomousMode] = useState<boolean>(false);
  const [autonomousStatus, setAutonomousStatus] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');
  
  // Reference to the preview frame for autonomous agent
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  
  // Toggle autonomous mode
  const toggleAutonomousMode = () => {
    const newMode = !isAutonomousMode;
    setIsAutonomousMode(newMode);
    
    if (newMode) {
      // Start autonomous agent when enabled
      addLog('log', 'Starting autonomous background processing...');
      
      // Register callbacks for the agent
      autonomousAgent.registerCallbacks({
        onStatusChange: (status) => {
          setAutonomousStatus(status);
          addLog('log', `Autonomous agent status: ${status}`);
        },
        onLog: (type, message) => {
          addLog(type, message);
        },
        onFileUpdate: (fileId, content) => {
          updateFileContent(fileId, content);
        },
        onTestsRun: (testId, fileIds) => {
          runTests(testId, fileIds);
        },
        onAnalysisComplete: (analysis) => {
          // Handle analysis results
          if (analysis.issues?.length > 0) {
            toast({
              title: "Issues Detected",
              description: `Found ${analysis.issues.length} issues in your application`,
              variant: "destructive",
            });
          }
        }
      });
      
      // Set preview frame if available
      if (previewFrameRef.current) {
        autonomousAgent.setPreviewFrame(previewFrameRef.current);
      }
      
      // Start the agent
      autonomousAgent.start();
      
      toast({
        title: "Autonomous Mode Enabled",
        description: "AI will now automatically improve your code in the background",
      });
    } else {
      // Stop autonomous agent when disabled
      autonomousAgent.stop();
      addLog('log', 'Autonomous background processing stopped');
      
      toast({
        title: "Autonomous Mode Disabled",
        description: "Background processing has been stopped",
      });
    }
  };
  
  const sendPromptToCursor = async (prompt: string) => {
    try {
      setCursorStatus('Processing');
      addLog('log', `Sending prompt to Cursor AI: ${prompt}`);
      
      // Use our cursorAIService to process the prompt
      if (cursorAIService) {
        // First try to use Cursor Editor if connected
        if (isCursorEditorConnected) {
          addLog('log', 'Using direct Cursor Editor integration');
        } else {
          addLog('log', 'Using server-side AI processing');
        }
        
        // Send the prompt to the service (it will handle the connection logic)
        const response = await cursorAIService.sendPrompt(prompt, activeFile.id, activeFile.content);
        
        if (response.success) {
          addLog('log', 'Cursor AI processed the prompt successfully');
          setCursorStatus('Ready');
          
          // If we got suggestions from the response, log them
          if (response.suggestions && response.suggestions.length > 0) {
            response.suggestions.forEach((suggestion: string) => {
              addLog('log', `Suggestion: ${suggestion}`);
            });
          }
          
          // If there's a detailed analysis, log it
          if (response.detailedAnalysis) {
            addLog('log', `Analysis: ${response.detailedAnalysis}`);
          }
          
          // If code snippet is provided, show it in the console
          if (response.codeSnippet) {
            addLog('log', `Suggested code:\n${response.codeSnippet}`);
          }
          
          // If the response includes file changes, apply them
          if (response.fileChanges) {
            const { fileId, content } = response.fileChanges;
            updateFileContent(fileId, content);
            
            // Update git status to reflect changes
            setGitStatus(prev => {
              const fileName = files.find(f => f.id === fileId)?.name || '';
              if (!fileName) return prev;
              
              return {
                ...prev,
                modified: prev.modified.includes(fileName) 
                  ? prev.modified 
                  : [...prev.modified, fileName]
              };
            });
            
            toast({
              title: "Code Updated",
              description: "Cursor AI has updated your code based on the prompt",
            });
          }
        } else {
          throw new Error(response.error || 'Unknown error');
        }
      } else {
        // Fallback to local simulation for testing/development
        const response = await simulateApiCall(prompt);
        
        if (response.success) {
          addLog('log', 'Cursor AI processed the prompt successfully (simulation)');
          setCursorStatus('Ready');
          
          // If the response includes code changes, apply them
          if (response.fileChanges) {
            const { fileId, content } = response.fileChanges;
            updateFileContent(fileId, content);
            
            // Update git status to reflect changes
            setGitStatus(prev => {
              const fileName = files.find(f => f.id === fileId)?.name || '';
              if (!fileName) return prev;
              
              return {
                ...prev,
                modified: prev.modified.includes(fileName) 
                  ? prev.modified 
                  : [...prev.modified, fileName]
              };
            });
            
            toast({
              title: "Code Updated",
              description: "Cursor AI has updated your code based on the prompt (simulation)",
            });
          }
        } else {
          throw new Error(response.error || 'Unknown error');
        }
      }
    } catch (error: any) {
      addLog('error', `Cursor AI error: ${error.message}`);
      setCursorStatus('Error');
      
      toast({
        title: "Error",
        description: `Failed to process prompt: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Simulate API call to Cursor AI
  const simulateApiCall = async (prompt: string): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful response with code changes
        if (prompt.toLowerCase().includes('implement') && prompt.toLowerCase().includes('submitform')) {
          const fileContent = files.find(f => f.id === '3')?.content || '';
          const updatedContent = fileContent.replace(
            `function submitForm(data) {
    // Implementation missing
    console.log('Submitting form:', data);
  }`,
            `function submitForm(data) {
    // Implemented form submission
    console.log('Submitting form:', data);
    
    fetch('https://api.example.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(result => {
        console.log('Success:', result);
        alert('Form submitted successfully!');
      })
      .catch(error => {
        console.error('Error:', error);
        showError('Failed to submit form. Please try again.');
      });
  }`
          );
          
          resolve({
            success: true,
            fileChanges: {
              fileId: '3',
              content: updatedContent
            }
          });
        } else {
          resolve({ success: true });
        }
      }, 1500);
    });
  };
  
  // Initialize the cursorAIService
  useEffect(() => {
    // Initialize cursorAIService with toast provider
    const toastFn = (args: any) => toast(args);
    cursorAIService.initToast({ toast: toastFn });
    
    // Check for stored API key
    const hasCursorAPIKey = localStorage.getItem('hasCursorAPIKey');
    if (hasCursorAPIKey === 'true') {
      addLog('log', 'Cursor API key found in storage');
    }
  }, []);
  
  // WebSocket connection
  useEffect(() => {
    // Setup WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket at:', wsUrl);
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      addLog('log', 'Connected to server');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle different message types from the server
        if (data.type === 'cursorResponse') {
          setCursorStatus('Ready');
          
          // Extract the response data
          const responseData = data.data;
          
          // Log a more user-friendly message
          addLog('log', `Received response from Cursor AI: ${responseData.response}`);
          
          // If suggestions are available, log them
          if (responseData.suggestions && responseData.suggestions.length > 0) {
            responseData.suggestions.forEach((suggestion: string) => {
              addLog('log', `Suggestion: ${suggestion}`);
            });
          }
          
          // If there's a detailed analysis, log it
          if (responseData.detailedAnalysis) {
            addLog('log', `Analysis: ${responseData.detailedAnalysis}`);
          }
          
          // If code snippet is provided, show it in the console
          if (responseData.codeSnippet) {
            addLog('log', `Suggested code:\n${responseData.codeSnippet}`);
          }
          
          // Apply file changes if provided
          if (responseData.fileChanges) {
            const { fileId, content } = responseData.fileChanges;
            updateFileContent(fileId.toString(), content);
            
            // Update git status to reflect changes
            setGitStatus(prev => {
              const fileName = files.find(f => f.id === fileId.toString())?.name || '';
              if (!fileName) return prev;
              
              const isAlreadyModified = prev.modified.includes(fileName);
              return {
                ...prev,
                modified: isAlreadyModified 
                  ? prev.modified 
                  : [...prev.modified, fileName]
              };
            });
            
            toast({
              title: "Code Updated",
              description: "Cursor AI has updated your code based on the prompt",
            });
          }
        } else if (data.type === 'codeAnalysis') {
          // Handle code analysis results
          const issuesCount = data.data.issues ? data.data.issues.length : 0;
          addLog('log', `Code analysis complete: ${issuesCount} issues found`);
          
          // Update issues
          if (data.data.issues && data.data.issues.length > 0) {
            const newIssues = data.data.issues.map((issue: any) => ({
              ...issue,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
            }));
            
            setIssues(prevIssues => {
              const filteredIssues = prevIssues.filter(issue => issue.fileId !== data.data.fileId.toString());
              return [...filteredIssues, ...newIssues];
            });
            
            // Notify user of issues
            toast({
              title: "Issues Detected",
              description: `Found ${issuesCount} issues in your code`,
              variant: "destructive",
            });
          } else {
            // No issues found - this is good!
            toast({
              title: "Code Analysis Complete",
              description: "No issues detected in your code",
              variant: "default",
            });
          }
        } else if (data.type === 'testResult') {
          // Handle test results
          addLog('log', `Test execution complete`);
          
          // Update test status with enhanced details
          if (Array.isArray(data.data)) {
            // Multiple tests were run
            const results = data.data;
            const passedTests = results.filter((result: any) => result.status === 'passed').length;
            const totalTests = results.length;
            
            // Calculate average coverage
            const totalCoverage = results.reduce((sum: number, result: any) => 
              sum + (result.details?.coverage || 0), 0);
            const avgCoverage = totalTests > 0 ? Math.round(totalCoverage / totalTests) : 0;
            
            // Find total execution time
            const totalExecutionTime = results.reduce((sum: number, result: any) => 
              sum + (result.details?.executionTime || 0), 0);
            
            // Log detailed results
            addLog('log', `Test Results: ${passedTests}/${totalTests} passed, ${avgCoverage}% coverage, ${totalExecutionTime}ms total execution time`);
            
            // For failed tests, log specific failure details
            results
              .filter((result: any) => result.status === 'failed')
              .forEach((result: any) => {
                addLog('error', `Test #${result.testId} failed: ${result.result}`);
                
                // Log failed assertions
                const failedAssertions = result.details?.assertions?.filter((a: any) => a.status === 'failed') || [];
                failedAssertions.forEach((assertion: any) => {
                  addLog('error', `  - ${assertion.name}`);
                });
              });
            
            // Update tests in state
            setTests(prevTests => 
              prevTests.map(test => {
                const matchingResult = results.find((result: any) => result.testId.toString() === test.id);
                if (matchingResult) {
                  return {
                    ...test,
                    status: matchingResult.status,
                    result: matchingResult.result,
                    // Store additional details in the test object
                    details: matchingResult.details
                  };
                }
                return test;
              })
            );
            
            // Notify user of test results
            toast({
              title: "Tests Completed",
              description: `${passedTests} of ${totalTests} tests passed with ${avgCoverage}% coverage`,
              variant: passedTests === totalTests ? "default" : "destructive",
            });
          } else {
            // Single test was run
            const testResult = data.data;
            const isPassed = testResult.status === 'passed';
            const coverage = testResult.details?.coverage || 0;
            const executionTime = testResult.details?.executionTime || 0;
            
            // Log detailed result
            addLog('log', `Test #${testResult.testId} ${isPassed ? 'passed' : 'failed'}: ${coverage}% coverage, ${executionTime}ms execution time`);
            
            // If test failed, log assertion details
            if (!isPassed && testResult.details?.assertions) {
              const failedAssertions = testResult.details.assertions.filter((a: any) => a.status === 'failed');
              failedAssertions.forEach((assertion: any) => {
                addLog('error', `  - ${assertion.name} failed`);
              });
            }
            
            // Update test in state
            setTests(prevTests => 
              prevTests.map(test => 
                test.id === testResult.testId.toString() 
                  ? { 
                      ...test, 
                      status: testResult.status, 
                      result: testResult.result,
                      details: testResult.details
                    }
                  : test
              )
            );
            
            // Notify user of test result
            toast({
              title: isPassed ? "Test Passed" : "Test Failed",
              description: `${testResult.result} (${coverage}% coverage)`,
              variant: isPassed ? "default" : "destructive",
            });
          }
        } else if (data.type === 'error') {
          // Handle errors
          addLog('error', `Server error: ${data.message}`);
          
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Error parsing WebSocket message:', error);
        addLog('error', `Error processing server message: ${error.message}`);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      addLog('error', 'WebSocket connection error');
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      addLog('log', 'Disconnected from server');
    };
    
    // Clean up the WebSocket connection when the component is unmounted
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);
  
  // Load data from server on initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, we would fetch data from the server
        // For now, we're using the mocked data above
        // Example API call:
        // const projectsResponse = await apiRequest('GET', '/api/projects');
        // setProjects(await projectsResponse.json());
      } catch (error) {
        console.error('Failed to load initial data', error);
      }
    };
    
    fetchData();
  }, []);
  
  // Listen for file changes to update git status
  useEffect(() => {
    const handleFileChange = () => {
      // In a real app, we would check which files have changed
      // For now, just simulate changes to the active file
      if (activeFile.type !== 'folder') {
        setGitStatus(prev => {
          const fileName = activeFile.name;
          return {
            ...prev,
            modified: prev.modified.includes(fileName) 
              ? prev.modified 
              : [...prev.modified, fileName]
          };
        });
      }
    };
    
    // This is a simplified version, in a real app we'd have proper diffing
    handleFileChange();
  }, [files]);
  
  // Cursor Editor connection methods
  const setCursorAPIKey = (apiKey: string) => {
    try {
      // Initialize the cursorAIService with the API key
      if (cursorAIService) {
        // Set API key for the Cursor Editor connector
        if (apiKey) {
          addLog('log', 'Setting Cursor API key...');
          
          // Store in local storage for persistence (we'll just store a placeholder, not the actual key)
          localStorage.setItem('hasCursorAPIKey', 'true');
          
          // We're using OpenAI directly on the server side, but register the API key with cursorAIService
          // for when direct Cursor Editor integration is available
          toast({
            title: "API Key Set",
            description: "Cursor API key has been configured",
          });
        } else {
          addLog('error', 'Empty API key provided');
          toast({
            title: "Error",
            description: "Please provide a valid API key",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Error setting Cursor API key:', error);
      addLog('error', `Failed to set Cursor API key: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to set API key: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const connectToCursorEditor = async (options: { host: string, port: number }): Promise<boolean> => {
    try {
      // Log the connection attempt
      addLog('log', `Connecting to Cursor Editor at ${options.host}:${options.port}...`);
      
      // Try to connect to the editor
      if (cursorAIService) {
        // Create a new CursorEditorConnector
        const editorConnector = new CursorEditorConnector({
          host: options.host,
          port: options.port
        });
        
        // Try to connect
        const connected = await editorConnector.connect();
        
        if (connected) {
          setIsCursorEditorConnected(true);
          addLog('log', 'Successfully connected to Cursor Editor');
          toast({
            title: "Connected",
            description: "Successfully connected to Cursor Editor",
          });
          return true;
        } else {
          throw new Error('Failed to connect to Cursor Editor');
        }
      } else {
        throw new Error('Cursor AI service not initialized');
      }
    } catch (error: any) {
      console.error('Error connecting to Cursor Editor:', error);
      addLog('error', `Failed to connect to Cursor Editor: ${error.message}`);
      setIsCursorEditorConnected(false);
      toast({
        title: "Connection Error",
        description: `Failed to connect to Cursor Editor: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const contextValue: ProjectContextType = {
    user,
    projects,
    activeProject,
    setActiveProject,
    
    files,
    activeFile,
    setActiveFile,
    updateFileContent,
    
    logs,
    addLog,
    clearLogs,
    
    issues,
    
    tests,
    runTests,
    addTest,
    
    gitStatus,
    commitChanges,
    rollbackChanges,
    branches,
    currentBranch,
    switchBranch,
    
    sendPromptToCursor,
    cursorStatus,
    
    // Cursor AI Configuration
    setCursorAPIKey,
    connectToCursorEditor,
    isCursorEditorConnected,
    
    // Autonomous background processing
    isAutonomousMode,
    toggleAutonomousMode,
    autonomousStatus,
    
    appVersion
  };
  
  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};
