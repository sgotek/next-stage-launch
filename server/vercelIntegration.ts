/**
 * Vercel Integration Module
 * Handles automatic project creation, deployment, and environment variable injection
 */

interface CreateVercelProjectParams {
  name: string;
  githubRepoFullName: string; // owner/repo
  vercelToken: string;
}

interface SetEnvVarsParams {
  projectId: string;
  envVars: Record<string, string>;
  vercelToken: string;
}

export async function createVercelProject(params: CreateVercelProjectParams): Promise<{ projectId: string; projectUrl: string }> {
  const { name, githubRepoFullName, vercelToken } = params;

  // Create Vercel project
  const response = await fetch("https://api.vercel.com/v9/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      framework: null, // Serverless functions
      gitRepository: {
        type: "github",
        repo: githubRepoFullName,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vercel API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    projectId: data.id,
    projectUrl: `https://${data.name}.vercel.app`,
  };
}

export async function setVercelEnvVars(params: SetEnvVarsParams): Promise<void> {
  const { projectId, envVars, vercelToken } = params;

  // Set environment variables
  for (const [key, value] of Object.entries(envVars)) {
    const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Failed to set env var ${key}:`, error);
      // Continue with other vars
    }
  }
}

export async function triggerVercelDeployment(params: { projectId: string; vercelToken: string }): Promise<{ deploymentUrl: string }> {
  const { projectId, vercelToken } = params;

  const response = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectId,
      target: "production",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vercel deployment error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    deploymentUrl: data.url,
  };
}

