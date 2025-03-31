import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from 'ws';
import { insertUserSchema, insertProjectSchema, insertFileSchema, insertLogSchema, insertIssueSchema, insertTestSchema, insertGitOperationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  
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
    // In a real implementation, this would interact with the Cursor AI API
    // For now, return a simple response
    return {
      prompt,
      response: "Processed prompt successfully",
      suggestions: [
        "Consider adding error handling",
        "Implement form validation"
      ]
    };
  }
  
  async function processCodeUpdate(fileId: number, content: string) {
    // Update the file content
    await storage.updateFile(fileId, { content });
    
    // Analyze code for issues
    // This would be more sophisticated in a real implementation
    const issues = [];
    
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
      const test = await storage.getTest(testId);
      
      if (!test) {
        throw new Error('Test not found');
      }
      
      // Simulate test execution
      const passed = Math.random() > 0.3;
      const result = passed ? 'Test passed successfully' : 'Expected function to be called with correct arguments';
      
      await storage.updateTest(testId, {
        status: passed ? 'passed' : 'failed',
        result
      });
      
      return {
        testId,
        status: passed ? 'passed' : 'failed',
        result
      };
    } else {
      // Run all tests for the given files
      const testsToRun = await Promise.all(fileIds.map(fileId => 
        storage.getTestsByFileId(fileId)
      ));
      
      const flattenedTests = testsToRun.flat();
      
      // Simulate test execution for all tests
      const results = await Promise.all(flattenedTests.map(async test => {
        const passed = Math.random() > 0.3;
        const result = passed ? 'Test passed successfully' : 'Expected function to be called with correct arguments';
        
        await storage.updateTest(test.id, {
          status: passed ? 'passed' : 'failed',
          result
        });
        
        return {
          testId: test.id,
          status: passed ? 'passed' : 'failed',
          result
        };
      }));
      
      return results;
    }
  }

  return httpServer;
}
