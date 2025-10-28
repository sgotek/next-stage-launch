import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Key, Zap } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: apiKeys } = trpc.apiKeys.list.useQuery();

  const stats = [
    {
      title: "Tổng Dự Án",
      value: projects?.length || 0,
      icon: Folder,
      description: "Dự án Flutter đang hoạt động",
    },
    {
      title: "API Keys",
      value: apiKeys?.length || 0,
      icon: Key,
      description: "Tích hợp đã cấu hình",
    },
    {
      title: "Hoàn Thành",
      value: projects?.filter((p) => p.status === "completed").length || 0,
      icon: Zap,
      description: "Đã triển khai thành công",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bảng Điều Khiển</h1>
          <p className="text-muted-foreground mt-2">
            Chào mừng đến với Hệ Thống Quản Lý Dự Án Flutter
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hành Động Nhanh</CardTitle>
            <CardDescription>
              Bắt đầu với quy trình dự án Flutter của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href="/projects/new">
              <Button className="w-full" size="lg">
                <Folder className="h-4 w-4 mr-2" />
                Tạo Dự Án Mới
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full" size="lg">
                <Key className="h-4 w-4 mr-2" />
                Quản Lý API Keys
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to set up your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Configure API Keys</p>
                  <p className="text-sm text-muted-foreground">
                    Add your Perplexity, OpenAI, and Gemini API keys in Settings
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Create Your First Project</p>
                  <p className="text-sm text-muted-foreground">
                    Start a new Flutter project with automated workflow
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Follow the Workflow</p>
                  <p className="text-sm text-muted-foreground">
                    Let AI analyze, design, and help you build your app
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
