import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Play, Copy, Rocket, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusConfig = {
  analyzing: { label: "1. Đang Phân Tích", color: "bg-blue-100 text-blue-800", step: 1 },
  awaiting_design: { label: "2. Chờ Thiết Kế", color: "bg-yellow-100 text-yellow-800", step: 2 },
  awaiting_assembly: { label: "3. Chờ Lắp Ráp", color: "bg-orange-100 text-orange-800", step: 3 },
  awaiting_backend: { label: "4. Chờ Backend", color: "bg-purple-100 text-purple-800", step: 4 },
  completed: { label: "5. Hoàn Thành", color: "bg-green-100 text-green-800", step: 5 },
};

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "0");
  const [figmaLink, setFigmaLink] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  const [checklist, setChecklist] = useState({
    importedFigma: false,
    connectedAuth: false,
    createdPages: false,
  });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.projects.get.useQuery({ id: projectId });

  const runAnalysisMutation = trpc.projects.runAnalysis.useMutation({
    onSuccess: () => {
      toast.success("Analysis completed successfully!");
      utils.projects.get.invalidate({ id: projectId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully!");
      utils.projects.get.invalidate({ id: projectId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deployBackendMutation = trpc.projects.deployBackend.useMutation({
    onSuccess: (result) => {
      toast.success("Backend deployed successfully!");
      utils.projects.get.invalidate({ id: projectId });
    },
    onError: (error) => {
      toast.error(`Deployment failed: ${error.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate({ projectId });
  };

  const handleDeployBackend = (mode: "auto" | "manual" = "auto") => {
    deployBackendMutation.mutate({ projectId, mode });
  };

  const handleSaveFigmaLink = () => {
    if (!figmaLink.trim()) {
      toast.error("Please enter a Figma link");
      return;
    }
    updateProjectMutation.mutate({
      id: projectId,
      status: "awaiting_assembly",
    });
    toast.success("Figma link saved! Status updated to Awaiting Assembly");
  };

  const handleSaveBackendUrl = () => {
    if (!backendUrl.trim()) {
      toast.error("Please enter a backend URL");
      return;
    }
    updateProjectMutation.mutate({
      id: projectId,
      status: "completed",
    });
    toast.success("Backend URL saved! Project marked as completed");
  };

  const handleCompleteChecklist = () => {
    if (!checklist.importedFigma || !checklist.connectedAuth || !checklist.createdPages) {
      toast.error("Please complete all checklist items");
      return;
    }
    updateProjectMutation.mutate({
      id: projectId,
      status: "awaiting_backend",
    });
    toast.success("Checklist completed! Status updated to Awaiting Backend");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <Link href="/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { project, analysis, screenshots, steps } = data;
  const currentStatus = statusConfig[project.status as keyof typeof statusConfig];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.featureDescription}</p>
            </div>
          </div>
          <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
        </div>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{format(new Date(project.createdAt), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">{format(new Date(project.updatedAt), "PPP")}</p>
              </div>
              {project.appStoreLink && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">App Store Link</p>
                  <a
                    href={project.appStoreLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {project.appStoreLink}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Screenshots */}
        {screenshots && screenshots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ảnh Chụp Màn Hình</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {screenshots.map((screenshot) => (
                  <img
                    key={screenshot.id}
                    src={screenshot.fileUrl}
                    alt="Project screenshot"
                    className="rounded-lg border"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bước 1: Phân Tích AI</CardTitle>
                <CardDescription>Tạo kiến trúc và đặc tả kỹ thuật</CardDescription>
              </div>
              {!analysis && (
                <Button
                  onClick={handleRunAnalysis}
                  disabled={runAnalysisMutation.isPending}
                >
                  {runAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Chạy Phân Tích
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          {analysis && (
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
                  <TabsTrigger value="schema">DB Schema</TabsTrigger>
                  <TabsTrigger value="rls">RLS Policies</TabsTrigger>
                  <TabsTrigger value="storage">Lưu Trữ</TabsTrigger>
                  <TabsTrigger value="functions">Functions</TabsTrigger>
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                  <TabsTrigger value="raw">Kết Quả Gốc</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm">
                      📋 <strong>Mục đích:</strong> Tổng quan về tech stack, tính năng và chiến lược kiếm tiền. Dùng cho tài liệu dự án.
                    </AlertDescription>
                  </Alert>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Tech Stack & Tổng Quan</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(analysis.techRecommendations || "")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sao Chép Tổng Quan
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{analysis.techRecommendations || "No overview available"}</pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schema" className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-sm">
                      🗄️ <strong>Sao chép vào:</strong> <Badge className="bg-green-600">Supabase</Badge> SQL Editor → Chạy SQL này để tạo bảng
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Database Schema (SQL)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.dbSchema || "")}
                      className="border-green-600 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Sao Chép vào Supabase
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{analysis.dbSchema || "No schema available"}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="rls" className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-sm">
                      🔒 <strong>Sao chép vào:</strong> <Badge className="bg-green-600">Supabase</Badge> SQL Editor → Chạy sau khi tạo bảng để bật bảo mật
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Row Level Security Policies</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.rlsPolicies || "")}
                      className="border-green-600 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Sao Chép vào Supabase
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{analysis.rlsPolicies || "No RLS policies available"}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="storage" className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-sm">
                      📦 <strong>Tạo trong:</strong> <Badge className="bg-green-600">Supabase</Badge> Storage → Tạo buckets thủ công dựa trên config này
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Cấu Hình Storage Buckets</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.storageBuckets || "")}
                      className="border-green-600 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Sao Chép Config
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{analysis.storageBuckets || "No storage buckets defined"}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="functions" className="space-y-4">
                  <Alert className="bg-gray-50 border-gray-300">
                    <AlertDescription className="text-sm">
                      ⚡ <strong>Deploy vào:</strong> <Badge className="bg-black">Vercel</Badge> → Tạo thư mục /api và paste các functions này
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Serverless Functions (Vercel)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.serverlessFunctions || "")}
                      className="border-gray-800 text-gray-900 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Sao Chép vào Vercel
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{analysis.serverlessFunctions || "No serverless functions available"}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                  <Alert className="bg-purple-50 border-purple-200">
                    <AlertDescription className="text-sm">
                      🎨 <strong>Dùng trong:</strong> <Badge className="bg-purple-600">Figma</Badge> để thiết kế UI + <Badge className="bg-blue-600">FlutterFlow</Badge> để triển khai
                    </AlertDescription>
                  </Alert>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Thư Viện Prompts</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(analysis.promptLibrary || "")}
                        className="border-purple-600 text-purple-700 hover:bg-purple-50"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sao Chép Prompts
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{analysis.promptLibrary || "No prompts available"}</pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="raw" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Perplexity Research</h3>
                    <Textarea
                      value={analysis.perplexityOutput || ""}
                      readOnly
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">OpenAI Specification</h3>
                    <Textarea
                      value={analysis.openaiOutput || ""}
                      readOnly
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Gemini Master Blueprint</h3>
                    <Textarea
                      value={analysis.geminiMasterPrompt || ""}
                      readOnly
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Deploy Backend Buttons */}
              {analysis && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-900 mb-1">Deploy Backend</h4>
                      <p className="text-sm text-purple-700 mb-3">
                        <strong>Auto:</strong> Tự động tạo GitHub repo, deploy Vercel, setup Supabase<br/>
                        <strong>Manual:</strong> Chỉ setup Supabase, bạn tự deploy GitHub/Vercel
                      </p>
                      {analysis.deploymentStatus && (
                        <Alert className="mb-3">
                          <AlertDescription>
                            <strong>Status:</strong> {analysis.deploymentStatus}
                          </AlertDescription>
                        </Alert>
                      )}
                      {analysis.githubRepoUrl && (
                        <div className="mb-2">
                          <a
                            href={analysis.githubRepoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            GitHub Repo <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {analysis.vercelProjectUrl && (
                        <div>
                          <a
                            href={analysis.vercelProjectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            Vercel Project <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDeployBackend("manual")}
                        disabled={deployBackendMutation.isPending || analysis.deploymentStatus === "completed" || analysis.deploymentStatus === "manual_setup_complete"}
                        variant="outline"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        {deployBackendMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Manual Deploy
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDeployBackend("auto")}
                        disabled={deployBackendMutation.isPending || analysis.deploymentStatus === "completed"}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {deployBackendMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Auto Deploy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Step 2: Design */}
        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: UI Design (Figma)</CardTitle>
              <CardDescription>Create your UI design in Figma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="figma-link">Figma Design Link</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="figma-link"
                    placeholder="https://figma.com/..."
                    value={figmaLink}
                    onChange={(e) => setFigmaLink(e.target.value)}
                  />
                  <Button onClick={handleSaveFigmaLink} disabled={updateProjectMutation.isPending}>
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Assembly */}
        {project.status !== "analyzing" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Frontend Assembly (FlutterFlow)</CardTitle>
              <CardDescription>Build your app in FlutterFlow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="imported-figma"
                    checked={checklist.importedFigma}
                    onCheckedChange={(checked) =>
                      setChecklist({ ...checklist, importedFigma: checked as boolean })
                    }
                  />
                  <label htmlFor="imported-figma" className="text-sm cursor-pointer">
                    Imported Figma design to FlutterFlow
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="connected-auth"
                    checked={checklist.connectedAuth}
                    onCheckedChange={(checked) =>
                      setChecklist({ ...checklist, connectedAuth: checked as boolean })
                    }
                  />
                  <label htmlFor="connected-auth" className="text-sm cursor-pointer">
                    Connected Supabase authentication
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="created-pages"
                    checked={checklist.createdPages}
                    onCheckedChange={(checked) =>
                      setChecklist({ ...checklist, createdPages: checked as boolean })
                    }
                  />
                  <label htmlFor="created-pages" className="text-sm cursor-pointer">
                    Created all pages and connected API calls
                  </label>
                </div>
              </div>
              <Button onClick={handleCompleteChecklist} disabled={updateProjectMutation.isPending}>
                Mark Assembly Complete
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Backend */}
        {(project.status === "awaiting_backend" || project.status === "completed") && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Backend Integration</CardTitle>
              <CardDescription>Connect your backend URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="backend-url">Backend URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="backend-url"
                    placeholder="https://your-backend.vercel.app"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveBackendUrl} disabled={updateProjectMutation.isPending}>
                    Complete Project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflow Timeline */}
        {steps && steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workflow Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{step.stepName}</p>
                      {step.completedAt && (
                        <p className="text-sm text-gray-600">
                          Completed: {format(new Date(step.completedAt), "PPp")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

