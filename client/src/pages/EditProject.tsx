import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function EditProject() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  
  const [projectName, setProjectName] = useState("");
  const [appStoreLink, setAppStoreLink] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");

  const { data, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const utils = trpc.useUtils();

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully!");
      utils.projects.list.invalidate();
      utils.projects.get.invalidate({ id: projectId });
      setLocation(`/projects/${projectId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (data?.project) {
      setProjectName(data.project.name);
      setAppStoreLink(data.project.appStoreLink || "");
      setFeatureDescription(data.project.featureDescription || "");
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    updateMutation.mutate({
      id: projectId,
      name: projectName,
      appStoreLink: appStoreLink || undefined,
      featureDescription: featureDescription || undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <Link href="/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Project</h1>
            <p className="text-muted-foreground mt-2">
              Update your project information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Update basic information about your Flutter app project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="e.g., My Awesome App"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              {/* App Store Link */}
              <div className="space-y-2">
                <Label htmlFor="appStoreLink">
                  App Store / Play Store Link (Optional)
                </Label>
                <Input
                  id="appStoreLink"
                  type="url"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  value={appStoreLink}
                  onChange={(e) => setAppStoreLink(e.target.value)}
                />
              </div>

              {/* Feature Description */}
              <div className="space-y-2">
                <Label htmlFor="featureDescription">Feature Description</Label>
                <Textarea
                  id="featureDescription"
                  placeholder="Describe the key features and functionality of your app..."
                  rows={6}
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link href={`/projects/${projectId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}

