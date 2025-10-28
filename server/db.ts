import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// API Keys Management
export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { apiKeys } = await import("../drizzle/schema");
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
}

export async function getApiKeyByName(userId: number, keyName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { apiKeys } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  const result = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.keyName, keyName))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createApiKey(data: { userId: number; keyName: string; keyValue: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { apiKeys } = await import("../drizzle/schema");
  const result = await db.insert(apiKeys).values(data);
  return result;
}

export async function updateApiKey(id: number, userId: number, keyValue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { apiKeys } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  await db.update(apiKeys).set({ keyValue, updatedAt: new Date() }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

export async function deleteApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { apiKeys } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

// Projects Management
export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { projects } = await import("../drizzle/schema");
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(projects.createdAt);
}

export async function getProjectById(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { projects } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: { userId: number; name: string; appStoreLink?: string; featureDescription?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projects } = await import("../drizzle/schema");
  await db.insert(projects).values(data);
  // Get the last inserted project
  const inserted = await db.select().from(projects).where(eq(projects.userId, data.userId)).orderBy(projects.id).limit(1);
  return inserted.length > 0 ? inserted[0].id : 0;
}

export async function updateProject(projectId: number, userId: number, data: Partial<{ name: string; appStoreLink: string; featureDescription: string; status: 'analyzing' | 'awaiting_design' | 'awaiting_assembly' | 'awaiting_backend' | 'completed' }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projects } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  await db.update(projects).set({ ...data, updatedAt: new Date() }).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function deleteProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projects } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

// Project Screenshots
export async function getProjectScreenshots(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const { projectScreenshots } = await import("../drizzle/schema");
  return db.select().from(projectScreenshots).where(eq(projectScreenshots.projectId, projectId));
}

export async function createProjectScreenshot(data: { projectId: number; fileUrl: string; fileKey: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectScreenshots } = await import("../drizzle/schema");
  await db.insert(projectScreenshots).values(data);
  return 0; // Return placeholder as insertId is not reliably available
}

// Project Analysis
export async function getProjectAnalysis(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { projectAnalysis } = await import("../drizzle/schema");
  const result = await db.select().from(projectAnalysis).where(eq(projectAnalysis.projectId, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProjectAnalysis(data: { projectId: number; perplexityOutput?: string; openaiOutput?: string; geminiMasterPrompt?: string; dbSchema?: string; apiLogic?: string; techRecommendations?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectAnalysis } = await import("../drizzle/schema");
  await db.insert(projectAnalysis).values(data);
  return 0; // Return placeholder as insertId is not reliably available
}

// Project Steps
export async function getProjectSteps(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const { projectSteps } = await import("../drizzle/schema");
  return db.select().from(projectSteps).where(eq(projectSteps.projectId, projectId)).orderBy(projectSteps.stepNumber);
}

export async function createProjectStep(data: { projectId: number; stepNumber: number; stepName: string; data?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectSteps } = await import("../drizzle/schema");
  await db.insert(projectSteps).values(data);
  return 0; // Return placeholder as insertId is not reliably available
}

export async function updateProjectStep(stepId: number, data: { completed?: number; data?: string; completedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectSteps } = await import("../drizzle/schema");
  await db.update(projectSteps).set(data).where(eq(projectSteps.id, stepId));
}
