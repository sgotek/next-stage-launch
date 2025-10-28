# Flutter Project Manager - TODO

## Phase 1: Database Schema & Backend API
- [x] Design and implement database schema for projects, API keys, analysis results, and workflow steps
- [x] Create database helper functions in server/db.ts
- [x] Implement tRPC procedures for authentication
- [x] Implement tRPC procedures for API key management (CRUD)
- [x] Implement tRPC procedures for project management (CRUD)
- [x] Implement tRPC procedures for workflow steps
- [x] Add file upload support for project screenshots
- [x] Integrate external AI APIs (Perplexity, OpenAI, Gemini) for analysis

## Phase 2: Frontend Core UI
- [x] Design color scheme and typography in index.css
- [x] Create DashboardLayout with sidebar navigation
- [x] Build Settings page for API key management
- [x] Build Projects Dashboard (list view with status)
- [x] Add project creation flow - Step 1: Input Form
- [x] Add project creation flow - Step 2: Architecture Analysis
- [x] Add project creation flow - Step 3: UI Design Input
- [x] Add project creation flow - Step 4: Frontend Assembly Checklist
- [x] Add project creation flow - Step 5-6: Backend Deployment
- [x] Add project creation flow - Step 7-8: Completion

## Phase 3: Project Management Features
- [x] Add project detail view with progress timeline
- [x] Implement status tracking and updates
- [ ] Add search and filter functionality for projects
- [ ] Create project analytics/statistics view
- [x] Add export functionality for analysis results
- [x] Implement copy-to-clipboard for code snippets

## Phase 4: Testing & Polish
- [ ] Test all workflow steps end-to-end
- [ ] Add loading states and error handling
- [ ] Implement optimistic updates where appropriate
- [ ] Add empty states for all lists
- [ ] Test file upload functionality
- [ ] Verify API integrations
- [ ] Add user feedback (toasts, notifications)

## Phase 5: Deployment
- [ ] Create checkpoint before deployment
- [ ] Test in production environment
- [ ] Document deployment process




## Phase 5: Advanced Automation Features (NEW)
- [x] Add edit/delete functionality for projects
- [x] Enhance Master Blueprint with RLS Policies section
- [x] Enhance Master Blueprint with Storage Buckets section
- [x] Enhance Master Blueprint with Serverless Functions code (Python/Node.js)
- [x] Enhance Master Blueprint with Prompt Library (Figma, FlutterFlow)
- [x] Add GitHub integration - Auto create repo
- [x] Add GitHub integration - Auto push code
- [x] Add Vercel integration - Auto create project
- [x] Add Vercel integration - Auto deploy functions
- [x] Add Vercel integration - Auto inject environment variables
- [x] Add Supabase integration - Auto execute SQL
- [x] Add Supabase integration - Auto create storage buckets
- [x] Add FlutterFlow manual integration guide with code snippets
- [x] Add "Deploy Backend Automatically" button and workflow
- [x] Add deployment status tracking
- [x] Add GitHub repo URL and Vercel URL display



## Bugs to Fix
- [x] Fix Perplexity API "Bad Request" error (changed model from llama-3.1-sonar-small-128k-online to sonar)


- [x] Fix Gemini API model name (gemini-1.5-pro → gemini-2.5-flash)
- [ ] Fix "Run Analysis" button - Error 500 (testing after Gemini fix)



## Phase 6: UI/UX Improvements
- [x] Add clear tabs for 6 sections of Gemini Master Blueprint
- [x] Add "Copy to [Tool]" buttons with tool-specific labels (Supabase, Vercel, Figma, FlutterFlow)
- [x] Add color-coded badges for each tool (Supabase=green, Vercel=black, Figma=purple, FlutterFlow=blue)
- [x] Add step-by-step instructions for each section
- [x] Show which sections go to which tools clearly



## Phase 7: Vietnamese Localization
- [x] Việt hóa Dashboard page
- [ ] Việt hóa Projects list page
- [ ] Việt hóa Settings page
- [x] Việt hóa Project Detail page (tabs, buttons, instructions) - Keep code/prompts in English
- [ ] Việt hóa New Project form
- [ ] Việt hóa Edit Project form
- [ ] Việt hóa error messages and toasts
- [x] Check if GITHUB_TOKEN exists in Settings (Confirmed: All tokens present)
- [x] Confirmed all required tokens available (GITHUB_API_KEY, VERCEL_API_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)



## Bugs to Fix
- [x] Fix Vercel project name validation error (cannot contain '---' sequence) - Created nameNormalizer.ts utility


- [x] Fix GitHub API error - Token name mismatch - Added fallback support for GITHUB_TOKEN/GITHUB_API_KEY, VERCEL_TOKEN/VERCEL_API_TOKEN, SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY


- [x] Fix GitHub authentication - Changed from Bearer to token prefix for classic PAT support + added detailed error logging



## New Features
- [x] Add Manual Deploy Mode - Skip GitHub/Vercel automation, only setup Supabase (SQL + RLS + Buckets)

