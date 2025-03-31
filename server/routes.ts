import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  insertUserSchema, insertProjectSchema, insertFileSchema, 
  insertLogSchema, insertIssueSchema, insertTestSchema, 
  insertGitOperationSchema, InsertFile 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket for real-time communication with clients
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'cursorPrompt') {
          // Process Cursor AI prompt
          // In a real implementation, this would interact with the Cursor AI API
          const response = await processCursorPrompt(data.prompt, data.fileId);
          ws.send(JSON.stringify({ type: 'cursorResponse', success: true, data: response }));
        } else if (data.type === 'updateCode') {
          // Update file content
          // This would trigger code analysis, error detection, etc.
          const response = await processCodeUpdate(data.fileId, data.content);
          ws.send(JSON.stringify({ type: 'codeAnalysis', success: true, data: response }));
        } else if (data.type === 'runTest') {
          // Run automated testing
          const testResult = await runTest(data.testId, data.fileIds);
          ws.send(JSON.stringify({ type: 'testResult', success: true, data: testResult }));
        }
      } catch (error: any) {
        ws.send(JSON.stringify({ type: 'error', message: error.message }));
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  
  // User API routes
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user data' });
    }
  });
  
  app.get('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
  
  // Project API routes
  app.post('/api/projects', async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: 'Invalid project data' });
    }
  });
  
  app.get('/api/projects', async (req, res) => {
    const userId = parseInt(req.query.userId as string);
    const projects = await storage.getProjectsByUserId(userId);
    res.json(projects);
  });
  
  app.get('/api/projects/:id', async (req, res) => {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  });
  
  // File API routes
  app.post('/api/files', async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ error: 'Invalid file data' });
    }
  });
  
  app.get('/api/projects/:projectId/files', async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const files = await storage.getFilesByProjectId(projectId);
    res.json(files);
  });
  
  app.put('/api/files/:id', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const fileData = req.body;
      
      const updatedFile = await storage.updateFile(fileId, fileData);
      
      if (!updatedFile) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.json(updatedFile);
    } catch (error) {
      res.status(400).json({ error: 'Invalid file data' });
    }
  });
  
  // Log API routes
  app.post('/api/logs', async (req, res) => {
    try {
      const logData = insertLogSchema.parse(req.body);
      const log = await storage.createLog(logData);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: 'Invalid log data' });
    }
  });
  
  app.get('/api/projects/:projectId/logs', async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const logs = await storage.getLogsByProjectId(projectId);
    res.json(logs);
  });
  
  // Issue API routes
  app.post('/api/issues', async (req, res) => {
    try {
      const issueData = insertIssueSchema.parse(req.body);
      const issue = await storage.createIssue(issueData);
      res.status(201).json(issue);
    } catch (error) {
      res.status(400).json({ error: 'Invalid issue data' });
    }
  });
  
  app.get('/api/projects/:projectId/issues', async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const issues = await storage.getIssuesByProjectId(projectId);
    res.json(issues);
  });
  
  app.put('/api/issues/:id', async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      const issueData = req.body;
      
      const updatedIssue = await storage.updateIssue(issueId, issueData);
      
      if (!updatedIssue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      
      res.json(updatedIssue);
    } catch (error) {
      res.status(400).json({ error: 'Invalid issue data' });
    }
  });
  
  // Test API routes
  app.post('/api/tests', async (req, res) => {
    try {
      const testData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      res.status(400).json({ error: 'Invalid test data' });
    }
  });
  
  app.get('/api/projects/:projectId/tests', async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const tests = await storage.getTestsByProjectId(projectId);
    res.json(tests);
  });
  
  app.put('/api/tests/:id', async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const testData = req.body;
      
      const updatedTest = await storage.updateTest(testId, testData);
      
      if (!updatedTest) {
        return res.status(404).json({ error: 'Test not found' });
      }
      
      res.json(updatedTest);
    } catch (error) {
      res.status(400).json({ error: 'Invalid test data' });
    }
  });
  
  // Git operations API routes
  app.post('/api/git-operations', async (req, res) => {
    try {
      const gitOperationData = insertGitOperationSchema.parse(req.body);
      const gitOperation = await storage.createGitOperation(gitOperationData);
      res.status(201).json(gitOperation);
    } catch (error) {
      res.status(400).json({ error: 'Invalid git operation data' });
    }
  });
  
  app.get('/api/projects/:projectId/git-operations', async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const gitOperations = await storage.getGitOperationsByProjectId(projectId);
    res.json(gitOperations);
  });
  
  // Helper functions for processing WebSocket requests
  async function processCursorPrompt(prompt: string, fileId: number) {
    // Get the file to understand its context
    const file = await storage.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    // In a real implementation, this would interact with the Cursor AI API
    // Here we're creating a more detailed and context-aware mock implementation
    
    // Analyze prompt for different types of requests
    const promptLower = prompt.toLowerCase();
    
    // Generate different responses based on prompt content
    let response = {
      prompt,
      response: "Processed prompt successfully",
      suggestions: [] as string[],
      codeSnippet: "",
      detailedAnalysis: "",
      fileChanges: null as any
    };
    
    // Handle different types of prompts
    if (promptLower.includes('implement') || promptLower.includes('create') || promptLower.includes('add')) {
      // Implementation request
      response.response = "Implementation suggestion created";
      
      // Generate relevant code based on file type
      if (file.type === 'js' || file.type === 'ts') {
        response.suggestions = [
          "Add try/catch blocks for error handling",
          "Consider adding parameter validation",
          "Implement proper return types"
        ];
        
        if (promptLower.includes('api') || promptLower.includes('fetch')) {
          response.codeSnippet = `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`;
        } else if (promptLower.includes('form') || promptLower.includes('submit')) {
          response.codeSnippet = `function submitForm(data) {
  // Form validation
  if (!data.email || !data.name) {
    throw new Error('Email and name are required');
  }
  
  // API submission
  return fetch('https://api.example.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Form submission failed');
    }
    return response.json();
  })
  .then(result => {
    console.log('Success:', result);
    return result;
  })
  .catch(error => {
    console.error('Error:', error);
    throw error;
  });
}`;
        }
        
        // Mock file changes
        // Only modify the file if it's the active file and has "Implementation missing" or "TODO" comments
        const fileContent = file.content || '';
        if (fileContent.includes('// Implementation missing') || fileContent.includes('// TODO')) {
          let updatedContent = fileContent;
          
          // Replace the placeholder in the active file
          if (promptLower.includes('submitform')) {
            updatedContent = fileContent.replace(
              /function\s+submitForm\s*\([^)]*\)\s*\{[^}]*\}/,
              response.codeSnippet
            );
          }
          
          response.fileChanges = {
            fileId,
            content: updatedContent
          };
        }
      }
    } else if (promptLower.includes('optimize') || promptLower.includes('improve')) {
      // Optimization request
      response.response = "Optimization suggestions provided";
      response.suggestions = [
        "Consider using memoization to prevent redundant calculations",
        "Replace inefficient loops with array methods",
        "Implement proper error boundaries"
      ];
      response.detailedAnalysis = "Performance bottlenecks detected in loop operations and error handling patterns. Recommended refactoring to use functional programming approaches and proper error management.";
    } else if (promptLower.includes('debug') || promptLower.includes('fix')) {
      // Debugging request
      response.response = "Debug analysis complete";
      response.suggestions = [
        "Check for null/undefined values before accessing properties",
        "Validate input parameters",
        "Add proper error handling for edge cases"
      ];
      response.detailedAnalysis = "Potential issues include missing null checks, insufficient input validation, and incomplete error handling patterns.";
    } else if (promptLower.includes('explain')) {
      // Code explanation request
      response.response = "Code explanation generated";
      response.detailedAnalysis = "This code implements a form submission workflow with client-side validation before sending data to a server. It includes error handling for both validation and server response issues.";
    }
    
    // Return the enhanced response
    return response;
  }
  
  async function processCodeUpdate(fileId: number, content: string) {
    // Update the file content with type-safe content parameter
    const contentUpdate: Partial<InsertFile> = { content };
    await storage.updateFile(fileId, contentUpdate as any);
    
    // Analyze code for issues
    // This would be more sophisticated in a real implementation
    const issues: Array<{
      title: string;
      description: string;
      severity: string;
      fileId: number;
    }> = [];
    
    if (content.includes('// TODO') || content.includes('// Implementation missing')) {
      issues.push({
        title: 'Missing Implementation',
        description: 'The code contains uncompleted TODO items or missing implementations',
        severity: 'high',
        fileId
      });
    }
    
    if (content.includes('console.log(')) {
      issues.push({
        title: 'Debug Code',
        description: 'Console.log statements should be removed in production code',
        severity: 'low',
        fileId
      });
    }
    
    return {
      fileId,
      issues
    };
  }
  
  async function runTest(testId: number | undefined, fileIds: number[]) {
    if (testId) {
      // Run a specific test
      const test = await storage.getTest(testId);
      
      if (!test) {
        throw new Error('Test not found');
      }
      
      // Get the file being tested
      const file = await storage.getFile(test.fileId);
      if (!file) {
        throw new Error('Test target file not found');
      }
      
      // More sophisticated test execution simulation that considers the content of the file
      const fileContent = file.content || '';
      const testScript = test.script || '';
      
      // Analyze the test and file to determine if it should pass
      let passed = false;
      let result = '';
      let coverage = 0;
      let executionTime = 0;
      let assertionResults = [] as any[];
      
      // Parse the test script to extract what's being tested
      const isFormTest = testScript.includes('form') || testScript.includes('submit');
      const isApiTest = testScript.includes('api') || testScript.includes('fetch');
      const isValidationTest = testScript.includes('valid') || testScript.includes('validation');
      
      // Check if the file has implementations for what's being tested
      if (isFormTest && fileContent.includes('function submitForm')) {
        // Form testing - check if validation and API call are implemented
        passed = fileContent.includes('validation') || fileContent.includes('if (!data.email');
        if (passed) {
          result = 'Test passed successfully';
          coverage = Math.floor(Math.random() * 30) + 70; // 70-100% coverage
          executionTime = Math.floor(Math.random() * 50) + 50; // 50-100ms
          
          assertionResults = [
            { name: 'Should validate email', status: 'passed' },
            { name: 'Should validate name', status: 'passed' },
            { name: 'Should call API with correct data', status: 'passed' }
          ];
        } else {
          result = 'Expected form validation to be implemented';
          coverage = Math.floor(Math.random() * 40) + 30; // 30-70% coverage
          executionTime = Math.floor(Math.random() * 40) + 20; // 20-60ms
          
          assertionResults = [
            { name: 'Should validate email', status: fileContent.includes('email') ? 'passed' : 'failed' },
            { name: 'Should validate name', status: fileContent.includes('name') ? 'passed' : 'failed' },
            { name: 'Should call API with correct data', status: fileContent.includes('fetch') ? 'passed' : 'failed' }
          ];
        }
      } else if (isApiTest && fileContent.includes('fetch(')) {
        // API testing - check if error handling is implemented
        passed = fileContent.includes('try') && fileContent.includes('catch');
        if (passed) {
          result = 'API fetch test passed successfully';
          coverage = Math.floor(Math.random() * 20) + 80; // 80-100% coverage
          executionTime = Math.floor(Math.random() * 60) + 40; // 40-100ms
          
          assertionResults = [
            { name: 'Should make HTTP request', status: 'passed' },
            { name: 'Should handle network errors', status: 'passed' },
            { name: 'Should parse response correctly', status: 'passed' }
          ];
        } else {
          result = 'Expected error handling for API calls';
          coverage = Math.floor(Math.random() * 30) + 40; // 40-70% coverage
          executionTime = Math.floor(Math.random() * 30) + 20; // 20-50ms
          
          assertionResults = [
            { name: 'Should make HTTP request', status: 'passed' },
            { name: 'Should handle network errors', status: fileContent.includes('catch') ? 'passed' : 'failed' },
            { name: 'Should parse response correctly', status: fileContent.includes('json') ? 'passed' : 'failed' }
          ];
        }
      } else if (isValidationTest) {
        // Validation testing
        passed = fileContent.includes('valid') || (fileContent.includes('if') && (fileContent.includes('!') || fileContent.includes('==') || fileContent.includes('==='))); 
        if (passed) {
          result = 'Validation test passed successfully';
          coverage = Math.floor(Math.random() * 20) + 80; // 80-100% coverage
          executionTime = Math.floor(Math.random() * 30) + 10; // 10-40ms
          
          assertionResults = [
            { name: 'Should validate input', status: 'passed' },
            { name: 'Should reject invalid input', status: 'passed' },
            { name: 'Should accept valid input', status: 'passed' }
          ];
        } else {
          result = 'Expected validation logic to be implemented';
          coverage = Math.floor(Math.random() * 20) + 30; // 30-50% coverage
          executionTime = Math.floor(Math.random() * 20) + 10; // 10-30ms
          
          assertionResults = [
            { name: 'Should validate input', status: 'failed' },
            { name: 'Should reject invalid input', status: 'failed' },
            { name: 'Should accept valid input', status: fileContent.includes('return') ? 'passed' : 'failed' }
          ];
        }
      } else {
        // Generic test with random result if no specific patterns are detected
        passed = Math.random() > 0.3;
        result = passed ? 'Test passed successfully' : 'Expected conditions not met in implementation';
        coverage = Math.floor(Math.random() * 70) + 30; // 30-100% coverage
        executionTime = Math.floor(Math.random() * 90) + 10; // 10-100ms
        
        assertionResults = [
          { name: 'Should execute without errors', status: passed ? 'passed' : 'failed' },
          { name: 'Should return expected output', status: passed ? 'passed' : 'failed' }
        ];
      }
      
      // Update test status in storage
      await storage.updateTest(testId, {
        status: passed ? 'passed' : 'failed',
        result
      });
      
      // Return detailed test results
      return {
        testId,
        status: passed ? 'passed' : 'failed',
        result,
        details: {
          coverage,
          executionTime,
          assertions: assertionResults
        }
      };
    } else {
      // Run all tests for the given files
      const testsPromises: Promise<any[]>[] = fileIds.map((fileId: number) => 
        storage.getTestsByFileId(fileId)
      );
      const testsToRun = await Promise.all(testsPromises);
      
      const flattenedTests: any[] = testsToRun.flat();
      
      if (flattenedTests.length === 0) {
        return [];
      }
      
      // Get all the files being tested
      const uniqueFileIds: number[] = Array.from(new Set(flattenedTests.map((test: any) => test.fileId)));
      const fileDetailsPromises = uniqueFileIds.map((fileId: number) => storage.getFile(fileId));
      const fileDetails = await Promise.all(fileDetailsPromises);
      
      // Create a map for quick file content lookup
      const fileContentMap = new Map();
      fileDetails.forEach(file => {
        if (file) {
          fileContentMap.set(file.id, file.content || '');
        }
      });
      
      // Simulate test execution for all tests with more sophisticated analysis
      const results = await Promise.all(flattenedTests.map(async test => {
        const fileContent = fileContentMap.get(test.fileId) || '';
        const testScript = test.script || '';
        
        // Analyze the test and file to determine if it should pass
        let passed = false;
        let result = '';
        let coverage = 0;
        let executionTime = 0;
        let assertionResults = [] as any[];
        
        // Parse the test script to extract what's being tested
        const isFormTest = testScript.includes('form') || testScript.includes('submit');
        const isApiTest = testScript.includes('api') || testScript.includes('fetch');
        const isValidationTest = testScript.includes('valid') || testScript.includes('validation');
        
        // Check if the file has implementations for what's being tested
        if (isFormTest && fileContent.includes('function submitForm')) {
          // Form testing - check if validation and API call are implemented
          passed = fileContent.includes('validation') || fileContent.includes('if (!data.email');
          if (passed) {
            result = 'Test passed successfully';
            coverage = Math.floor(Math.random() * 30) + 70; // 70-100% coverage
            executionTime = Math.floor(Math.random() * 50) + 50; // 50-100ms
            
            assertionResults = [
              { name: 'Should validate email', status: 'passed' },
              { name: 'Should validate name', status: 'passed' },
              { name: 'Should call API with correct data', status: 'passed' }
            ];
          } else {
            result = 'Expected form validation to be implemented';
            coverage = Math.floor(Math.random() * 40) + 30; // 30-70% coverage
            executionTime = Math.floor(Math.random() * 40) + 20; // 20-60ms
            
            assertionResults = [
              { name: 'Should validate email', status: fileContent.includes('email') ? 'passed' : 'failed' },
              { name: 'Should validate name', status: fileContent.includes('name') ? 'passed' : 'failed' },
              { name: 'Should call API with correct data', status: fileContent.includes('fetch') ? 'passed' : 'failed' }
            ];
          }
        } else if (isApiTest && fileContent.includes('fetch(')) {
          // API testing - check if error handling is implemented
          passed = fileContent.includes('try') && fileContent.includes('catch');
          if (passed) {
            result = 'API fetch test passed successfully';
            coverage = Math.floor(Math.random() * 20) + 80; // 80-100% coverage
            executionTime = Math.floor(Math.random() * 60) + 40; // 40-100ms
            
            assertionResults = [
              { name: 'Should make HTTP request', status: 'passed' },
              { name: 'Should handle network errors', status: 'passed' },
              { name: 'Should parse response correctly', status: 'passed' }
            ];
          } else {
            result = 'Expected error handling for API calls';
            coverage = Math.floor(Math.random() * 30) + 40; // 40-70% coverage
            executionTime = Math.floor(Math.random() * 30) + 20; // 20-50ms
            
            assertionResults = [
              { name: 'Should make HTTP request', status: 'passed' },
              { name: 'Should handle network errors', status: fileContent.includes('catch') ? 'passed' : 'failed' },
              { name: 'Should parse response correctly', status: fileContent.includes('json') ? 'passed' : 'failed' }
            ];
          }
        } else if (isValidationTest) {
          // Validation testing
          passed = fileContent.includes('valid') || (fileContent.includes('if') && (fileContent.includes('!') || fileContent.includes('==') || fileContent.includes('==='))); 
          if (passed) {
            result = 'Validation test passed successfully';
            coverage = Math.floor(Math.random() * 20) + 80; // 80-100% coverage
            executionTime = Math.floor(Math.random() * 30) + 10; // 10-40ms
            
            assertionResults = [
              { name: 'Should validate input', status: 'passed' },
              { name: 'Should reject invalid input', status: 'passed' },
              { name: 'Should accept valid input', status: 'passed' }
            ];
          } else {
            result = 'Expected validation logic to be implemented';
            coverage = Math.floor(Math.random() * 20) + 30; // 30-50% coverage
            executionTime = Math.floor(Math.random() * 20) + 10; // 10-30ms
            
            assertionResults = [
              { name: 'Should validate input', status: 'failed' },
              { name: 'Should reject invalid input', status: 'failed' },
              { name: 'Should accept valid input', status: fileContent.includes('return') ? 'passed' : 'failed' }
            ];
          }
        } else {
          // Generic test with random result if no specific patterns are detected
          passed = Math.random() > 0.3;
          result = passed ? 'Test passed successfully' : 'Expected conditions not met in implementation';
          coverage = Math.floor(Math.random() * 70) + 30; // 30-100% coverage
          executionTime = Math.floor(Math.random() * 90) + 10; // 10-100ms
          
          assertionResults = [
            { name: 'Should execute without errors', status: passed ? 'passed' : 'failed' },
            { name: 'Should return expected output', status: passed ? 'passed' : 'failed' }
          ];
        }
        
        // Update test status in storage
        await storage.updateTest(test.id, {
          status: passed ? 'passed' : 'failed',
          result
        });
        
        // Return detailed test results
        return {
          testId: test.id,
          status: passed ? 'passed' : 'failed',
          result,
          details: {
            coverage,
            executionTime,
            assertions: assertionResults
          }
        };
      }));
      
      return results;
    }
  }

  return httpServer;
}
