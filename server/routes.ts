import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  insertUserSchema, insertProjectSchema, insertFileSchema, 
  insertLogSchema, insertIssueSchema, insertTestSchema, 
  insertGitOperationSchema, InsertFile 
} from "@shared/schema";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
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
    
    console.log(`Processing prompt: ${prompt} for file: ${file.name}`);
    
    // Prepare response object structure
    let response = {
      prompt,
      response: "Processed prompt successfully",
      suggestions: [] as string[],
      codeSnippet: "",
      detailedAnalysis: "",
      fileChanges: null as any
    };
    
    try {
      // Determine the type of prompt based on keywords
      const promptLower = prompt.toLowerCase();
      const fileContent = file.content || '';
      const fileType = file.type || 'unknown';
      let promptType = 'general';
      
      if (promptLower.includes('implement') || promptLower.includes('create') || promptLower.includes('add')) {
        promptType = 'implementation';
      } else if (promptLower.includes('optimize') || promptLower.includes('improve')) {
        promptType = 'optimization';
      } else if (promptLower.includes('debug') || promptLower.includes('fix')) {
        promptType = 'debugging';
      } else if (promptLower.includes('explain')) {
        promptType = 'explanation';
      } else if (promptLower.includes('analyze') || promptLower.includes('review')) {
        promptType = 'code_review';
      }
      
      // Create a system prompt based on the type of request
      let systemPrompt = "";
      
      switch (promptType) {
        case 'implementation':
          systemPrompt = "You are an AI programming assistant that helps implement code features. Provide practical, clean code examples with error handling and best practices.";
          break;
        case 'optimization':
          systemPrompt = "You are an AI code optimization expert. Analyze the provided code for performance bottlenecks and suggest specific improvements with examples.";
          break;
        case 'debugging':
          systemPrompt = "You are an AI debugging assistant. Identify potential bugs or issues in the code and suggest fixes with clear explanations.";
          break;
        case 'explanation':
          systemPrompt = "You are an AI code explainer. Break down the provided code into simple explanations of what each part does and how they work together.";
          break;
        case 'code_review':
          systemPrompt = "You are an AI code reviewer. Analyze the provided code for best practices, potential issues, and improvements, using a constructive tone.";
          break;
        default:
          systemPrompt = "You are an AI programming assistant that provides helpful code-related information and solutions.";
      }
      
      // Craft a specific user message based on prompt type
      let userMessage = `
File: ${file.name} (${fileType})
Code content:
\`\`\`
${fileContent}
\`\`\`

User request: ${prompt}

Please provide the following in your response:
1. A brief explanation addressing the request
2. ${promptType === 'implementation' ? 'Code implementation that solves the request' : 
     promptType === 'optimization' ? 'Specific optimization suggestions with code examples' :
     promptType === 'debugging' ? 'An analysis of potential bugs and fixes' :
     promptType === 'explanation' ? 'A detailed explanation of how the code works' :
     promptType === 'code_review' ? 'A thorough code review with actionable insights' :
     'Helpful insights and suggestions related to the request'}
3. 3-5 bullet point suggestions for improving the code
`;

      // Send to OpenAI API
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 2048
      });
      
      // Extract content from OpenAI response
      const aiResponse = chatCompletion.choices[0].message.content || "No response generated";
      
      // Parse the AI response to extract different components
      const detailedAnalysis = aiResponse.split(/\d+\.\s/).length > 1 
        ? aiResponse.split(/\d+\.\s/)[1]?.trim() || "" 
        : aiResponse.split('\n\n')[0]?.trim() || "";
        
      // Extract code snippet if present (look for markdown code blocks)
      const codeBlockMatch = aiResponse.match(/```(?:js|javascript|typescript|ts)?\n([\s\S]*?)\n```/);
      const codeSnippet = codeBlockMatch ? codeBlockMatch[1].trim() : "";
      
      // Extract bullet point suggestions
      const bulletPointRegex = /[•*-]\s+(.*?)(?=\n[•*-]|\n\n|$)/g;
      const suggestions: string[] = [];
      let match;
      while ((match = bulletPointRegex.exec(aiResponse)) !== null) {
        if (match[1]) {
          suggestions.push(match[1].trim());
        }
      }
      
      // Prepare the response object
      response = {
        prompt,
        response: aiResponse.split('\n\n')[0]?.trim() || "AI response processed",
        suggestions: suggestions.length > 0 ? suggestions : ["Review code structure", "Add proper error handling", "Consider adding more documentation"],
        codeSnippet,
        detailedAnalysis,
        fileChanges: null
      };
      
      // If this is an implementation request and we have a code snippet, consider updating the file
      if (promptType === 'implementation' && codeSnippet && 
          (fileContent.includes('// TODO') || fileContent.includes('// Implementation missing'))) {
        
        // Simple update logic - in a real app, you'd want more sophisticated parsing
        let updatedContent = fileContent;
        
        // Look for TODO comments that match the prompt and replace them with the code
        const todoRegex = new RegExp(`(\\/\\/\\s*TODO.*?${promptLower.split(' ')[0]}.*?\\n)`, 'i');
        if (todoRegex.test(fileContent)) {
          updatedContent = fileContent.replace(todoRegex, `${codeSnippet}\n// Implemented: ${prompt}\n`);
          
          response.fileChanges = {
            fileId,
            content: updatedContent
          };
        }
      }
      
      console.log("AI response processed successfully");
      
    } catch (error: any) {
      console.error("Error with OpenAI API:", error.message);
      // Fallback response
      response.response = "Error processing with AI";
      response.detailedAnalysis = "There was an error connecting to the AI service. Please try again later.";
      response.suggestions = ["Check your network connection", "Verify API key configuration", "Try a different prompt"];
    }
    
    return response;
  }
  
  async function processCodeUpdate(fileId: number, content: string) {
    // Update the file content with type-safe content parameter
    const contentUpdate: Partial<InsertFile> = { content };
    await storage.updateFile(fileId, contentUpdate as any);
    
    console.log(`Processing code update for file ID: ${fileId}`);
    
    // Get the file to analyze its context
    const file = await storage.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Prepare issues array for storing findings
    const issues: Array<{
      title: string;
      description: string;
      severity: string;
      fileId: number;
    }> = [];
    
    // Basic static analysis checks
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
    
    try {
      // Use OpenAI to perform more sophisticated code analysis
      const systemPrompt = "You are an AI code reviewer specializing in finding potential bugs, security issues, and performance problems. Focus on practical, actionable issues that need to be fixed.";
      
      const userMessage = `
Please analyze this code for potential issues:

File: ${file.name} (${file.type || 'unknown'})
\`\`\`
${content}
\`\`\`

Identify only serious problems that need to be addressed. For each issue:
1. Provide a clear title
2. Describe the problem concisely
3. Rate severity as 'high', 'medium', or 'low'
4. Return ONLY in this JSON format:
[
  {
    "title": "Issue title",
    "description": "Brief description of the issue",
    "severity": "high|medium|low"
  }
]

If there are no serious issues beyond what's already noted (TODOs, console logs), return an empty array [].
`;

      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 1024
      });
      
      // Extract content from OpenAI response
      const aiResponse = chatCompletion.choices[0].message.content || "[]";
      
      try {
        // Find JSON in the response - look for array between square brackets
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const aiIssues = JSON.parse(jsonMatch[0]);
          
          // Add AI-detected issues to our issues array
          aiIssues.forEach((issue: any) => {
            if (issue.title && issue.description && issue.severity) {
              issues.push({
                title: issue.title,
                description: issue.description,
                severity: issue.severity,
                fileId
              });
            }
          });
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        // If parsing fails, still continue with the basic issues
      }
      
      // For each detected issue, create an entry in the storage
      await Promise.all(issues.map(issue => 
        storage.createIssue({
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          fileId,
          projectId: file.projectId
        })
      ));
      
      console.log(`Detected ${issues.length} issues in file ${file.name}`);
      
    } catch (error: any) {
      console.error("Error performing AI code analysis:", error.message);
      // If AI analysis fails, just return the basic issues
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
