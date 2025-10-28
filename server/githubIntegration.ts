/**
 * GitHub Integration Module
 * Handles automatic repository creation and code pushing
 */

interface CreateRepoParams {
  name: string;
  description?: string;
  private?: boolean;
  githubToken: string;
}

interface PushCodeParams {
  repoName: string;
  owner: string;
  files: Array<{ path: string; content: string }>;
  githubToken: string;
}

export async function createGitHubRepo(params: CreateRepoParams): Promise<{ repoUrl: string; fullName: string }> {
  const { name, description, private: isPrivate = true, githubToken } = params;

  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      name,
      description: description || `Backend for ${name}`,
      private: isPrivate,
      auto_init: true, // Initialize with README
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error('[GitHub] Repository creation failed:', {
      status: response.status,
      statusText: response.statusText,
      error,
      repoName: name,
    });
    throw new Error(`GitHub API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    repoUrl: data.html_url,
    fullName: data.full_name, // owner/repo
  };
}

export async function pushCodeToGitHub(params: PushCodeParams): Promise<void> {
  const { repoName, owner, files, githubToken } = params;

  // Get the default branch (usually 'main' or 'master')
  const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches/main`, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!branchResponse.ok) {
    throw new Error("Failed to get branch information");
  }

  const branchData = await branchResponse.json();
  const latestCommitSha = branchData.commit.sha;

  // Get the tree SHA from the latest commit
  const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      });

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree
  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
    method: "POST",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree,
    }),
  });

  const treeData = await treeResponse.json();

  // Create a new commit
  const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
    method: "POST",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      message: "Add serverless functions",
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  });

  const newCommitData = await newCommitResponse.json();

  // Update the reference
  await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      sha: newCommitData.sha,
    }),
  });
}

export async function getGitHubUsername(githubToken: string): Promise<string> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get GitHub user information");
  }

  const data = await response.json();
  return data.login;
}

