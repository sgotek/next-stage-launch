import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // API Keys Management
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserApiKeys } = await import("./db");
      const { decrypt } = await import("./encryption");
      const keys = await getUserApiKeys(ctx.user.id);
      // Return keys with decrypted values
      return keys.map((key) => ({
        ...key,
        keyValue: decrypt(key.keyValue),
      }));
    }),
    create: protectedProcedure
      .input(
        z.object({
          keyName: z.string().min(1),
          keyValue: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createApiKey, getApiKeyByName } = await import("./db");
        const { encrypt } = await import("./encryption");
        
        // Check if key already exists
        const existing = await getApiKeyByName(ctx.user.id, input.keyName);
        if (existing) {
          throw new Error("API key with this name already exists");
        }
        
        await createApiKey({
          userId: ctx.user.id,
          keyName: input.keyName,
          keyValue: encrypt(input.keyValue),
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          keyValue: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateApiKey } = await import("./db");
        const { encrypt } = await import("./encryption");
        await updateApiKey(input.id, ctx.user.id, encrypt(input.keyValue));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteApiKey } = await import("./db");
        await deleteApiKey(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Projects Management
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserProjects } = await import("./db");
      return getUserProjects(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getProjectById, getProjectScreenshots, getProjectAnalysis, getProjectSteps } = await import("./db");
        const project = await getProjectById(input.id, ctx.user.id);
        if (!project) throw new Error("Project not found");
        
        const screenshots = await getProjectScreenshots(input.id);
        const analysis = await getProjectAnalysis(input.id);
        const steps = await getProjectSteps(input.id);
        
        return { project, screenshots, analysis, steps };
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          appStoreLink: z.string().optional(),
          featureDescription: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createProject, createProjectStep } = await import("./db");
        const projectId = await createProject({
          userId: ctx.user.id,
          ...input,
        });
        
        // Initialize workflow steps
        const steps = [
          { stepNumber: 1, stepName: "Input Form" },
          { stepNumber: 2, stepName: "Architecture Analysis" },
          { stepNumber: 3, stepName: "UI Design" },
          { stepNumber: 4, stepName: "Frontend Assembly" },
          { stepNumber: 5, stepName: "Backend Deployment" },
          { stepNumber: 6, stepName: "Completion" },
        ];
        
        for (const step of steps) {
          await createProjectStep({ projectId, ...step });
        }
        
        return { projectId };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          appStoreLink: z.string().optional(),
          featureDescription: z.string().optional(),
          status: z.enum(["analyzing", "awaiting_design", "awaiting_assembly", "awaiting_backend", "completed"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateProject } = await import("./db");
        const { id, ...data } = input;
        await updateProject(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteProject } = await import("./db");
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
    uploadScreenshot: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          fileData: z.string(), // base64
          fileName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getProjectById, createProjectScreenshot } = await import("./db");
        const { storagePut } = await import("./storage");
        
        // Verify project ownership
        const project = await getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("Project not found");
        
        // Upload to S3
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `projects/${input.projectId}/screenshots/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, "image/png");
        
        // Save to database
        await createProjectScreenshot({
          projectId: input.projectId,
          fileUrl: url,
          fileKey,
        });
        
        return { url };
      }),
    runAnalysis: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { getProjectById, getUserApiKeys, getProjectScreenshots, createProjectAnalysis, updateProject } = await import("./db");
          const { decrypt } = await import("./encryption");
          const { runProjectAnalysis } = await import("./aiIntegration");
          
          // Get project
          const project = await getProjectById(input.projectId, ctx.user.id);
          if (!project) throw new Error("Project not found");
          
          // Get API keys
          const keys = await getUserApiKeys(ctx.user.id);
          const apiKeysMap = keys.reduce((acc, key) => {
            acc[key.keyName] = decrypt(key.keyValue);
            return acc;
          }, {} as Record<string, string>);
          
          // Check required keys
          if (!apiKeysMap.PERPLEXITY_API_KEY || !apiKeysMap.OPENAI_API_KEY || !apiKeysMap.GEMINI_API_KEY) {
            throw new Error("Missing required API keys. Please add PERPLEXITY_API_KEY, OPENAI_API_KEY, and GEMINI_API_KEY in Settings.");
          }
          
          // Get screenshots
          const screenshots = await getProjectScreenshots(input.projectId);
          
          console.log("[runAnalysis] Starting analysis for project:", project.name);
          
          // Run analysis
          const result = await runProjectAnalysis(
            {
              projectName: project.name,
              appStoreLink: project.appStoreLink || undefined,
              featureDescription: project.featureDescription || undefined,
              screenshotUrls: screenshots.map((s) => s.fileUrl),
            },
            {
              perplexity: apiKeysMap.PERPLEXITY_API_KEY,
              openai: apiKeysMap.OPENAI_API_KEY,
              gemini: apiKeysMap.GEMINI_API_KEY,
            }
          );
          
          console.log("[runAnalysis] Analysis completed successfully");
          
          // Save analysis
          await createProjectAnalysis({
            projectId: input.projectId,
            ...result,
          });
          
          // Update project status
          await updateProject(input.projectId, ctx.user.id, { status: "awaiting_design" });
          
          return { success: true };
        } catch (error) {
          console.error("[runAnalysis] Error:", error);
          throw new Error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }),
    updateStep: protectedProcedure
      .input(
        z.object({
          stepId: z.number(),
          completed: z.boolean(),
          data: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateProjectStep } = await import("./db");
        await updateProjectStep(input.stepId, {
          completed: input.completed ? 1 : 0,
          data: input.data,
          completedAt: input.completed ? new Date() : undefined,
        });
        return { success: true };
      }),
    deployBackend: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        mode: z.enum(["auto", "manual"]).default("auto")
      }))
      .mutation(async ({ ctx, input }) => {
        const { getProjectById, getProjectAnalysis, getUserApiKeys } = await import("./db");
        const { decrypt } = await import("./encryption");
        const { createGitHubRepo, pushCodeToGitHub, getGitHubUsername } = await import("./githubIntegration");
        const { createVercelProject, setVercelEnvVars } = await import("./vercelIntegration");
        const { executeSupabaseSQL, createMultipleBuckets } = await import("./supabaseIntegration");
        const { normalizeProjectName } = await import("./nameNormalizer");
        const { eq } = await import("drizzle-orm");
        const { projectAnalysis } = await import("../drizzle/schema");
        
        // Get project and analysis
        const project = await getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("Project not found");
        
        const analysisData = await getProjectAnalysis(input.projectId);
        if (!analysisData) throw new Error("Analysis not found. Please run analysis first.");
        
        // Get API keys
        const keys = await getUserApiKeys(ctx.user.id);
        const apiKeysMap = keys.reduce((acc, key) => {
          acc[key.keyName] = decrypt(key.keyValue);
          return acc;
        }, {} as Record<string, string>);
        
        // Helper function to get token with fallback names
        const getToken = (primaryName: string, fallbackNames: string[] = []) => {
          if (apiKeysMap[primaryName]) return apiKeysMap[primaryName];
          for (const fallback of fallbackNames) {
            if (apiKeysMap[fallback]) return apiKeysMap[fallback];
          }
          return null;
        };
        
        // Get tokens with fallback support
        const githubToken = getToken("GITHUB_TOKEN", ["GITHUB_API_KEY"]);
        const vercelToken = getToken("VERCEL_TOKEN", ["VERCEL_API_TOKEN"]);
        const supabaseUrl = getToken("SUPABASE_URL");
        const supabaseServiceKey = getToken("SUPABASE_SERVICE_KEY", ["SUPABASE_SERVICE_ROLE_KEY"]);
        
        // Check required keys based on mode
        if (input.mode === "auto") {
          if (!githubToken) throw new Error("Missing GitHub token. Please add GITHUB_TOKEN or GITHUB_API_KEY in Settings.");
          if (!vercelToken) throw new Error("Missing Vercel token. Please add VERCEL_TOKEN or VERCEL_API_TOKEN in Settings.");
        }
        if (!supabaseUrl) throw new Error("Missing Supabase URL. Please add SUPABASE_URL in Settings.");
        if (!supabaseServiceKey) throw new Error("Missing Supabase service key. Please add SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY in Settings.");
        
        try {
          // Update deployment status
          const db = await import("./db").then(m => m.getDb());
          
          // Manual mode: Skip GitHub/Vercel, only setup Supabase
          if (input.mode === "manual") {
            if (db) {
              await db.update(projectAnalysis).set({ deploymentStatus: "executing_sql" }).where(eq(projectAnalysis.id, analysisData.id));
            }
            
            // Execute Supabase SQL
            if (analysisData.dbSchema) {
              await executeSupabaseSQL({
                supabaseUrl,
                supabaseServiceKey,
                sql: analysisData.dbSchema,
              });
            }
            
            // Execute RLS Policies
            if (analysisData.rlsPolicies) {
              await executeSupabaseSQL({
                supabaseUrl,
                supabaseServiceKey,
                sql: analysisData.rlsPolicies,
              });
            }
            
            // Create storage buckets
            if (analysisData.storageBuckets) {
              try {
                const buckets = JSON.parse(analysisData.storageBuckets);
                await createMultipleBuckets(
                  supabaseUrl!,
                  supabaseServiceKey!,
                  buckets
                );
              } catch (e) {
                console.error("Failed to parse/create storage buckets:", e);
              }
            }
            
            // Mark as completed
            if (db) {
              await db.update(projectAnalysis).set({ 
                deploymentStatus: "manual_setup_complete"
              }).where(eq(projectAnalysis.id, analysisData.id));
            }
            
            return {
              success: true,
              mode: "manual",
              message: "Supabase setup completed. Download serverless functions code and deploy manually."
            };
          }
          
          // Auto mode: Full automation
          if (db) {
            await db.update(projectAnalysis).set({ deploymentStatus: "creating_repo" }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          // Step 1: Create GitHub repo
          const githubUsername = await getGitHubUsername(githubToken!);
          const repoName = normalizeProjectName(project.name) + "-backend";
          const { repoUrl, fullName } = await createGitHubRepo({
            name: repoName,
            description: `Backend for ${project.name}`,
            private: true,
            githubToken: githubToken!,
          });
          
          // Update status
          if (db) {
            await db.update(projectAnalysis).set({ 
              githubRepoUrl: repoUrl,
              deploymentStatus: "pushing_code" 
            }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          // Step 2: Push serverless functions code
          if (analysisData.serverlessFunctions) {
            // Parse functions from the blueprint
            const functionFiles = [];
            const functionMatches = Array.from(analysisData.serverlessFunctions.matchAll(/```(?:javascript|js)?\n\/\/ (api\/[^\n]+)\n([\s\S]*?)```/g));
            for (const match of functionMatches) {
              functionFiles.push({
                path: match[1],
                content: match[2].trim(),
              });
            }
            
            if (functionFiles.length > 0) {
              await pushCodeToGitHub({
                repoName,
                owner: githubUsername,
                files: functionFiles,
                githubToken: githubToken!,
              });
            }
          }
          
          // Update status
          if (db) {
            await db.update(projectAnalysis).set({ deploymentStatus: "creating_vercel_project" }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          // Step 3: Create Vercel project
          const { projectUrl } = await createVercelProject({
            name: repoName,
            githubRepoFullName: fullName,
            vercelToken: vercelToken!,
          });
          
          // Update status
          if (db) {
            await db.update(projectAnalysis).set({ 
              vercelProjectUrl: projectUrl,
              deploymentStatus: "setting_env_vars" 
            }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          // Step 4: Set Vercel environment variables
          await setVercelEnvVars({
            projectId: repoName,
            envVars: {
              SUPABASE_URL: supabaseUrl!,
              SUPABASE_ANON_KEY: getToken("SUPABASE_ANON_KEY") || "",
              SUPABASE_SERVICE_KEY: supabaseServiceKey!,
            },
            vercelToken: vercelToken!,
          });
          
          // Update status
          if (db) {
            await db.update(projectAnalysis).set({ deploymentStatus: "executing_sql" }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          // Step 5: Execute Supabase SQL
          if (analysisData.dbSchema) {
            await executeSupabaseSQL({
            supabaseUrl,
            supabaseServiceKey,
              sql: analysisData.dbSchema,
            });
          }
          
          // Step 6: Execute RLS Policies
          if (analysisData.rlsPolicies) {
            await executeSupabaseSQL({
              supabaseUrl: apiKeysMap.SUPABASE_URL,
              supabaseServiceKey: apiKeysMap.SUPABASE_SERVICE_KEY,
              sql: analysisData.rlsPolicies,
            });
          }
          
          // Update status
          if (db) {
            await db.update(projectAnalysis).set({ deploymentStatus: "creating_buckets" }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          // Step 7: Create storage buckets
          if (analysisData.storageBuckets) {
            try {
              const buckets = JSON.parse(analysisData.storageBuckets);
              await createMultipleBuckets(
                apiKeysMap.SUPABASE_URL,
                apiKeysMap.SUPABASE_SERVICE_KEY,
                buckets
              );
            } catch (e) {
              console.error("Failed to parse or create buckets:", e);
            }
          }
          
          // Final status update
          if (db) {
            await db.update(projectAnalysis).set({ deploymentStatus: "completed" }).where(eq(projectAnalysis.id, analysisData.id));
          }
          
          return { 
            success: true,
            githubRepoUrl: repoUrl,
            vercelProjectUrl: projectUrl,
          };
        } catch (error: any) {
          // Update status to failed
          const db = await import("./db").then(m => m.getDb());
          if (db) {
            await db.update(projectAnalysis).set({ 
              deploymentStatus: `failed: ${error.message}` 
            }).where(eq(projectAnalysis.id, analysisData.id));
          }
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
