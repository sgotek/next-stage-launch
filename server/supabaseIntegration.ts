/**
 * Supabase Integration Module
 * Handles automatic SQL execution and storage bucket creation
 */

interface ExecuteSQLParams {
  supabaseUrl: string;
  supabaseServiceKey: string;
  sql: string;
}

interface CreateBucketParams {
  supabaseUrl: string;
  supabaseServiceKey: string;
  bucketName: string;
  public?: boolean;
}

export async function executeSupabaseSQL(params: ExecuteSQLParams): Promise<void> {
  const { supabaseUrl, supabaseServiceKey, sql } = params;

  // Extract project reference from URL (e.g., https://abc123.supabase.co -> abc123)
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    throw new Error("Invalid Supabase URL format");
  }

  // Use Supabase Management API to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      query: sql,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase SQL execution error: ${error}`);
  }
}

export async function createSupabaseBucket(params: CreateBucketParams): Promise<void> {
  const { supabaseUrl, supabaseServiceKey, bucketName, public: isPublic = false } = params;

  const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: isPublic,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: null, // Allow all types
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // If bucket already exists, that's okay
    if (error.error !== "Bucket already exists") {
      throw new Error(`Supabase bucket creation error: ${error.message || response.statusText}`);
    }
  }
}

export async function setupSupabaseRLS(params: ExecuteSQLParams): Promise<void> {
  // RLS policies are just SQL, so we use the same function
  return executeSupabaseSQL(params);
}

export async function createMultipleBuckets(
  supabaseUrl: string,
  supabaseServiceKey: string,
  buckets: Array<{ name: string; public?: boolean }>
): Promise<void> {
  for (const bucket of buckets) {
    try {
      await createSupabaseBucket({
        supabaseUrl,
        supabaseServiceKey,
        bucketName: bucket.name,
        public: bucket.public,
      });
    } catch (error) {
      console.error(`Failed to create bucket ${bucket.name}:`, error);
      // Continue with other buckets
    }
  }
}

