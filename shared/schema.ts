import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'file' or 'folder'
  content: text("content"),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  parentId: integer("parent_id"), // Self-reference to parent folder
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Console logs table
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'log', 'error', 'warning', etc.
  message: text("message").notNull(),
  fileId: integer("file_id").references(() => files.id),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Issues table
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // 'high', 'medium', 'low'
  fileId: integer("file_id").references(() => files.id).notNull(),
  line: integer("line"),
  status: text("status").default("open").notNull(), // 'open', 'resolved'
  projectId: integer("project_id").references(() => projects.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tests table
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  script: text("script").notNull(),
  status: text("status").default("not_run").notNull(), // 'not_run', 'running', 'passed', 'failed'
  result: text("result"),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  fileId: integer("file_id").references(() => files.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Git operations table
export const gitOperations = pgTable("git_operations", {
  id: serial("id").primaryKey(),
  operation: text("operation").notNull(), // 'commit', 'branch', 'merge', etc.
  message: text("message"),
  status: jsonb("status"), // Store git status as JSON
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });
export const insertIssueSchema = createInsertSchema(issues).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGitOperationSchema = createInsertSchema(gitOperations).omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type GitOperation = typeof gitOperations.$inferSelect;
export type InsertGitOperation = z.infer<typeof insertGitOperationSchema>;
