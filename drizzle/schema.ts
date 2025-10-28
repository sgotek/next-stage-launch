import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// API Keys table (encrypted storage)
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyName: varchar("keyName", { length: 100 }).notNull(),
  keyValue: text("keyValue").notNull(), // encrypted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// Projects table
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  appStoreLink: text("appStoreLink"),
  featureDescription: text("featureDescription"),
  status: mysqlEnum("status", ["analyzing", "awaiting_design", "awaiting_assembly", "awaiting_backend", "completed"]).default("analyzing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Project Screenshots
export const projectScreenshots = mysqlTable("project_screenshots", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type ProjectScreenshot = typeof projectScreenshots.$inferSelect;
export type InsertProjectScreenshot = typeof projectScreenshots.$inferInsert;

// Project Analysis Results
export const projectAnalysis = mysqlTable("project_analysis", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  perplexityOutput: text("perplexityOutput"),
  openaiOutput: text("openaiOutput"),
  geminiMasterPrompt: text("geminiMasterPrompt"),
  dbSchema: text("dbSchema"),
  rlsPolicies: text("rlsPolicies"),
  storageBuckets: text("storageBuckets"),
  apiLogic: text("apiLogic"),
  serverlessFunctions: text("serverlessFunctions"),
  promptLibrary: text("promptLibrary"),
  techRecommendations: text("techRecommendations"),
  githubRepoUrl: varchar("githubRepoUrl", { length: 500 }),
  vercelProjectUrl: varchar("vercelProjectUrl", { length: 500 }),
  deploymentStatus: varchar("deploymentStatus", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectAnalysis = typeof projectAnalysis.$inferSelect;
export type InsertProjectAnalysis = typeof projectAnalysis.$inferInsert;

// Project Steps Tracking
export const projectSteps = mysqlTable("project_steps", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  stepNumber: int("stepNumber").notNull(),
  stepName: varchar("stepName", { length: 100 }).notNull(),
  completed: int("completed").default(0).notNull(), // 0 = false, 1 = true
  data: text("data"), // JSON string for flexible data storage
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectStep = typeof projectSteps.$inferSelect;
export type InsertProjectStep = typeof projectSteps.$inferInsert;