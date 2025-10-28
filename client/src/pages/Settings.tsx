import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const utils = trpc.useUtils();
  const { data: apiKeys, isLoading } = trpc.apiKeys.list.useQuery();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: () => {
      toast.success("API key added successfully");
      setNewKeyName("");
      setNewKeyValue("");
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.apiKeys.update.useMutation({
    onSuccess: () => {
      toast.success("API key updated successfully");
      setEditingId(null);
      setEditValue("");
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key deleted successfully");
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    createMutation.mutate({ keyName: newKeyName, keyValue: newKeyValue });
  };

  const handleUpdate = (id: number) => {
    if (!editValue.trim()) {
      toast.error("Please enter a value");
      return;
    }
    updateMutation.mutate({ id, keyValue: editValue });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this API key?")) {
      deleteMutation.mutate({ id });
    }
  };

  const requiredKeys = [
    { name: "PERPLEXITY_API_KEY", description: "For research and analysis" },
    { name: "OPENAI_API_KEY", description: "For technical specifications" },
    { name: "GEMINI_API_KEY", description: "For master prompt generation" },
    { name: "SUPABASE_URL", description: "Supabase project URL" },
    { name: "SUPABASE_ANON_KEY", description: "Supabase anonymous key" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
    { name: "VERCEL_API_TOKEN", description: "For deployment (optional)" },
    { name: "RAILWAY_API_TOKEN", description: "For deployment (optional)" },
    { name: "REPLICATE_API_TOKEN", description: "For AI processing (optional)" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your API keys and configuration
          </p>
        </div>

        {/* Add New Key */}
        <Card>
          <CardHeader>
            <CardTitle>Add New API Key</CardTitle>
            <CardDescription>
              Store your API keys securely. They will be encrypted before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., PERPLEXITY_API_KEY"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keyValue">Key Value</Label>
                <Input
                  id="keyValue"
                  type="password"
                  placeholder="Enter your API key"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add API Key
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Required Keys Info */}
        <Card>
          <CardHeader>
            <CardTitle>Required API Keys</CardTitle>
            <CardDescription>
              These keys are needed for the full workflow automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredKeys.map((key) => (
                <div key={key.name} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs text-muted-foreground">{key.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Existing Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              Manage your stored API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No API keys added yet. Add your first key above.
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{key.keyName}</p>
                      {editingId === key.id ? (
                        <Input
                          type="password"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Enter new value"
                          className="mt-2"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          •••••••••••••••••
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === key.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(key.id)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(key.id);
                              setEditValue(key.keyValue);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(key.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

