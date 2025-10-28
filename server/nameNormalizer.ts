/**
 * Name Normalizer Utility
 * Standardizes project names for GitHub, Vercel, and file systems
 */

/**
 * Normalize project name to be compatible with GitHub, Vercel, and file systems
 * 
 * Rules:
 * - Lowercase only
 * - Replace spaces with hyphens
 * - Remove special characters (keep only letters, numbers, hyphens, underscores)
 * - Replace multiple consecutive hyphens with single hyphen
 * - Remove leading/trailing hyphens
 * - Max 100 characters (Vercel limit)
 * - Cannot contain '---' sequence (Vercel restriction)
 */
export function normalizeProjectName(name: string): string {
  return name
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9\-_]/g, '') // Remove special characters
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit to 100 characters
}

/**
 * Normalize GitHub repository name
 * Same rules as project name
 */
export function normalizeGithubRepoName(name: string): string {
  return normalizeProjectName(name);
}

/**
 * Normalize Vercel project name
 * Same rules as project name
 */
export function normalizeVercelProjectName(name: string): string {
  return normalizeProjectName(name);
}

/**
 * Normalize file name for safe file system usage
 * Additional rule: Replace dots with hyphens (except file extension)
 */
export function normalizeFileName(name: string, extension?: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\./g, '-') // Replace dots with hyphens
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  
  return extension ? `${normalized}.${extension}` : normalized;
}

/**
 * Validate if a name is already normalized
 */
export function isValidProjectName(name: string): boolean {
  const normalized = normalizeProjectName(name);
  return name === normalized && name.length > 0 && name.length <= 100;
}

