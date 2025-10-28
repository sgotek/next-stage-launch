/**
 * AI Integration Module
 * Handles calls to Perplexity, OpenAI, and Gemini APIs for project analysis
 */

interface AnalysisInput {
  projectName: string;
  appStoreLink?: string;
  featureDescription?: string;
  screenshotUrls: string[];
}

interface AnalysisResult {
  perplexityOutput: string;
  openaiOutput: string;
  geminiMasterPrompt: string;
  dbSchema: string;
  rlsPolicies: string;
  storageBuckets: string;
  apiLogic: string;
  serverlessFunctions: string;
  promptLibrary: string;
  techRecommendations: string;
}

/**
 * Step 1: Call Perplexity API for research and analysis
 */
async function callPerplexityAPI(input: AnalysisInput, apiKey: string): Promise<string> {
  const prompt = `Analyze this mobile app project:
Project Name: ${input.projectName}
${input.appStoreLink ? `App Store Link: ${input.appStoreLink}` : ""}
Feature Description: ${input.featureDescription || "Not provided"}

Research similar apps, identify key features, and provide a comprehensive analysis of:
1. Core functionality requirements
2. User flow and interactions
3. Data models needed
4. Technical considerations
5. Best practices for this type of app

Provide a detailed technical analysis.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a mobile app architecture expert. Provide detailed technical analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Step 2: Call OpenAI API to process Perplexity output
 */
async function callOpenAIAPI(perplexityOutput: string, input: AnalysisInput, apiKey: string): Promise<string> {
  const prompt = `Based on this analysis:

${perplexityOutput}

For the project "${input.projectName}", create a structured technical specification including:
1. Database schema design (tables, relationships, fields)
2. API endpoints needed (REST/GraphQL)
3. Authentication and authorization requirements
4. File storage requirements
5. Third-party integrations needed

Format the output as a structured document.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a backend architect. Create detailed technical specifications.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Step 3: Call Gemini API to create Master Prompt
 */
async function callGeminiAPI(
  perplexityOutput: string,
  openaiOutput: string,
  input: AnalysisInput,
  apiKey: string
): Promise<{ masterPrompt: string; dbSchema: string; rlsPolicies: string; storageBuckets: string; apiLogic: string; serverlessFunctions: string; promptLibrary: string; techRecommendations: string }> {
  const prompt = `You are a technical architect creating a comprehensive "Master Blueprint" for a Flutter mobile app.

Project: ${input.projectName}

Initial Analysis:
${perplexityOutput}

Technical Specification:
${openaiOutput}

Create a Master Blueprint with exactly 6 sections:

## SECTION 1: OVERVIEW
Provide:
- Tech Stack summary (Frontend: Flutter, Backend: Supabase + Vercel)
- Monetization strategy
- Key features summary

## SECTION 2: DATABASE SCHEMA
Provide complete PostgreSQL/Supabase SQL:
- CREATE TABLE statements for all tables
- Foreign key relationships
- Indexes for performance
- Default values and constraints

## SECTION 3: RLS POLICIES
Provide Row Level Security policies for Supabase:
- SELECT policies (who can read)
- INSERT policies (who can create)
- UPDATE policies (who can modify)
- DELETE policies (who can remove)
Use proper SQL syntax: CREATE POLICY ... ON table_name ...

## SECTION 4: STORAGE BUCKETS
Provide JSON array of storage buckets:
[{"name": "avatars", "public": true}, {"name": "documents", "public": false}]

## SECTION 5: SERVERLESS FUNCTIONS
Provide complete Node.js code for at least 3 Vercel serverless functions:
- Each function in separate code block with filename
- Include error handling and validation
- Use Supabase client for database operations
Example: api/search.js, api/calculate.js, api/process.js

## SECTION 6: PROMPT LIBRARY
Provide:
6.1 FIGMA DESIGN PROMPT: Detailed prompt for designing UI in Figma
6.2 FLUTTERFLOW INSTRUCTIONS: Step-by-step guide for FlutterFlow integration

Format each section with clear headers and code blocks.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const fullOutput = data.candidates[0].content.parts[0].text;

  // Parse sections from the output
  const section1Match = fullOutput.match(/## SECTION 1: OVERVIEW([\s\S]*?)(?=## SECTION |$)/);
  const section2Match = fullOutput.match(/## SECTION 2: DATABASE SCHEMA([\s\S]*?)(?=## SECTION |$)/);
  const section3Match = fullOutput.match(/## SECTION 3: RLS POLICIES([\s\S]*?)(?=## SECTION |$)/);
  const section4Match = fullOutput.match(/## SECTION 4: STORAGE BUCKETS([\s\S]*?)(?=## SECTION |$)/);
  const section5Match = fullOutput.match(/## SECTION 5: SERVERLESS FUNCTIONS([\s\S]*?)(?=## SECTION |$)/);
  const section6Match = fullOutput.match(/## SECTION 6: PROMPT LIBRARY([\s\S]*?)(?=## SECTION |$)/);

  return {
    masterPrompt: fullOutput,
    dbSchema: section2Match ? section2Match[1].trim() : "",
    rlsPolicies: section3Match ? section3Match[1].trim() : "",
    storageBuckets: section4Match ? section4Match[1].trim() : "",
    apiLogic: section2Match ? section2Match[1].trim() : "", // API logic is part of overview
    serverlessFunctions: section5Match ? section5Match[1].trim() : "",
    promptLibrary: section6Match ? section6Match[1].trim() : "",
    techRecommendations: section1Match ? section1Match[1].trim() : "",
  };
}

/**
 * Main function: Run complete analysis workflow
 */
export async function runProjectAnalysis(
  input: AnalysisInput,
  apiKeys: {
    perplexity: string;
    openai: string;
    gemini: string;
  }
): Promise<AnalysisResult> {
  // Step 1: Perplexity Analysis
  const perplexityOutput = await callPerplexityAPI(input, apiKeys.perplexity);

  // Step 2: OpenAI Processing
  const openaiOutput = await callOpenAIAPI(perplexityOutput, input, apiKeys.openai);

  // Step 3: Gemini Master Prompt
  const geminiResult = await callGeminiAPI(perplexityOutput, openaiOutput, input, apiKeys.gemini);

  return {
    perplexityOutput,
    openaiOutput,
    geminiMasterPrompt: geminiResult.masterPrompt,
    dbSchema: geminiResult.dbSchema,
    rlsPolicies: geminiResult.rlsPolicies,
    storageBuckets: geminiResult.storageBuckets,
    apiLogic: geminiResult.apiLogic,
    serverlessFunctions: geminiResult.serverlessFunctions,
    promptLibrary: geminiResult.promptLibrary,
    techRecommendations: geminiResult.techRecommendations,
  };
}

