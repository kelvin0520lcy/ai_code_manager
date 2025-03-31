import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  files, type File, type InsertFile,
  logs, type Log, type InsertLog,
  issues, type Issue, type InsertIssue,
  tests, type Test, type InsertTest,
  gitOperations, type GitOperation, type InsertGitOperation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByProjectId(projectId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  
  // Log operations
  getLog(id: number): Promise<Log | undefined>;
  getLogsByProjectId(projectId: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Issue operations
  getIssue(id: number): Promise<Issue | undefined>;
  getIssuesByProjectId(projectId: number): Promise<Issue[]>;
  getIssuesByFileId(fileId: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined>;
  
  // Test operations
  getTest(id: number): Promise<Test | undefined>;
  getTestsByProjectId(projectId: number): Promise<Test[]>;
  getTestsByFileId(fileId: number): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  
  // Git operations
  getGitOperation(id: number): Promise<GitOperation | undefined>;
  getGitOperationsByProjectId(projectId: number): Promise<GitOperation[]>;
  createGitOperation(gitOperation: InsertGitOperation): Promise<GitOperation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private files: Map<number, File>;
  private logs: Map<number, Log>;
  private issues: Map<number, Issue>;
  private tests: Map<number, Test>;
  private gitOperations: Map<number, GitOperation>;
  
  private userId: number;
  private projectId: number;
  private fileId: number;
  private logId: number;
  private issueId: number;
  private testId: number;
  private gitOperationId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.files = new Map();
    this.logs = new Map();
    this.issues = new Map();
    this.tests = new Map();
    this.gitOperations = new Map();
    
    this.userId = 1;
    this.projectId = 1;
    this.fileId = 1;
    this.logId = 1;
    this.issueId = 1;
    this.testId = 1;
    this.gitOperationId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const project: Project = { ...insertProject, id, createdAt, updatedAt };
    this.projects.set(id, project);
    return project;
  }
  
  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async getFilesByProjectId(projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.projectId === projectId,
    );
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const file: File = { ...insertFile, id, createdAt, updatedAt };
    this.files.set(id, file);
    return file;
  }
  
  async updateFile(id: number, fileData: Partial<InsertFile>): Promise<File | undefined> {
    const file = this.files.get(id);
    
    if (!file) {
      return undefined;
    }
    
    const updatedFile: File = {
      ...file,
      ...fileData,
      updatedAt: new Date()
    };
    
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  // Log operations
  async getLog(id: number): Promise<Log | undefined> {
    return this.logs.get(id);
  }
  
  async getLogsByProjectId(projectId: number): Promise<Log[]> {
    return Array.from(this.logs.values()).filter(
      (log) => log.projectId === projectId,
    );
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logId++;
    const timestamp = new Date();
    const log: Log = { ...insertLog, id, timestamp };
    this.logs.set(id, log);
    return log;
  }
  
  // Issue operations
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }
  
  async getIssuesByProjectId(projectId: number): Promise<Issue[]> {
    return Array.from(this.issues.values()).filter(
      (issue) => issue.projectId === projectId,
    );
  }
  
  async getIssuesByFileId(fileId: number): Promise<Issue[]> {
    return Array.from(this.issues.values()).filter(
      (issue) => issue.fileId === fileId,
    );
  }
  
  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.issueId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const issue: Issue = { ...insertIssue, id, createdAt, updatedAt };
    this.issues.set(id, issue);
    return issue;
  }
  
  async updateIssue(id: number, issueData: Partial<InsertIssue>): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    
    if (!issue) {
      return undefined;
    }
    
    const updatedIssue: Issue = {
      ...issue,
      ...issueData,
      updatedAt: new Date()
    };
    
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }
  
  // Test operations
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async getTestsByProjectId(projectId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(
      (test) => test.projectId === projectId,
    );
  }
  
  async getTestsByFileId(fileId: number): Promise<Test[]> {
    // In a real implementation, we would have a relationship between tests and files
    // For now, let's return all tests for the project of the file
    const file = this.files.get(fileId);
    
    if (!file) {
      return [];
    }
    
    return this.getTestsByProjectId(file.projectId);
  }
  
  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.testId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const test: Test = { ...insertTest, id, createdAt, updatedAt };
    this.tests.set(id, test);
    return test;
  }
  
  async updateTest(id: number, testData: Partial<InsertTest>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    
    if (!test) {
      return undefined;
    }
    
    const updatedTest: Test = {
      ...test,
      ...testData,
      updatedAt: new Date()
    };
    
    this.tests.set(id, updatedTest);
    return updatedTest;
  }
  
  // Git operations
  async getGitOperation(id: number): Promise<GitOperation | undefined> {
    return this.gitOperations.get(id);
  }
  
  async getGitOperationsByProjectId(projectId: number): Promise<GitOperation[]> {
    return Array.from(this.gitOperations.values()).filter(
      (gitOperation) => gitOperation.projectId === projectId,
    );
  }
  
  async createGitOperation(insertGitOperation: InsertGitOperation): Promise<GitOperation> {
    const id = this.gitOperationId++;
    const timestamp = new Date();
    const gitOperation: GitOperation = { ...insertGitOperation, id, timestamp };
    this.gitOperations.set(id, gitOperation);
    return gitOperation;
  }
}

export const storage = new MemStorage();
