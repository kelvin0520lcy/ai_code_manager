import { createContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface Test {
  id: string;
  name: string;
  script: string;
  status: 'not_run' | 'running' | 'passed' | 'failed';
  result: string | null;
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
  runTests: (testId?: string) => void;
  addTest: (test: Test) => void;
  
  gitStatus: GitStatus;
  commitChanges: (message: string) => void;
  rollbackChanges: () => void;
  branches: string[];
  currentBranch: string;
  switchBranch: (branch: string) => void;
  
  sendPromptToCursor: (prompt: string) => void;
  cursorStatus: string;
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
      result: null
    }
  ]);
  
  const addTest = (test: Test) => {
    setTests(prevTests => [...prevTests, test]);
  };
  
  const runTests = (testId?: string) => {
    if (testId) {
      // Run specific test
      setTests(prevTests => prevTests.map(test => 
        test.id === testId ? { ...test, status: 'running', result: null } : test
      ));
      
      // Simulate test execution
      setTimeout(() => {
        setTests(prevTests => prevTests.map(test => 
          test.id === testId 
            ? { 
                ...test, 
                status: Math.random() > 0.3 ? 'passed' : 'failed',
                result: Math.random() > 0.3 
                  ? 'Test passed successfully' 
                  : 'Expected function to be called with correct arguments'
              } 
            : test
        ));
      }, 1500);
    } else {
      // Run all tests
      setTests(prevTests => prevTests.map(test => ({ ...test, status: 'running', result: null })));
      
      // Simulate test execution for all tests
      setTimeout(() => {
        setTests(prevTests => prevTests.map(test => ({ 
          ...test, 
          status: Math.random() > 0.3 ? 'passed' : 'failed',
          result: Math.random() > 0.3 
            ? 'Test passed successfully' 
            : 'Expected function to be called with correct arguments'
        })));
      }, 2000);
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
  const appVersion = 'v1.0.0';
  
  const sendPromptToCursor = async (prompt: string) => {
    try {
      setCursorStatus('Processing');
      addLog('log', `Sending prompt to Cursor AI: ${prompt}`);
      
      // In a real implementation, this would send the prompt to the Cursor AI API
      // Here we simulate the API call
      const response = await simulateApiCall(prompt);
      
      if (response.success) {
        addLog('log', 'Cursor AI processed the prompt successfully');
        setCursorStatus('Ready');
        
        // If the response includes code changes, apply them
        if (response.fileChanges) {
          const { fileId, content } = response.fileChanges;
          updateFileContent(fileId, content);
          
          // Update git status to reflect changes
          setGitStatus(prev => ({
            ...prev,
            modified: [...new Set([...prev.modified, files.find(f => f.id === fileId)?.name || ''])]
          }));
          
          toast({
            title: "Code Updated",
            description: "Cursor AI has updated your code based on the prompt",
          });
        }
      } else {
        throw new Error(response.error || 'Unknown error');
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
        setGitStatus(prev => ({
          ...prev,
          modified: [...new Set([...prev.modified, activeFile.name])]
        }));
      }
    };
    
    // This is a simplified version, in a real app we'd have proper diffing
    handleFileChange();
  }, [files]);
  
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
    appVersion
  };
  
  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};
