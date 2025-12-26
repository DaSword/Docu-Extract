import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Trash2, LogOut, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExtractionJob } from "@shared/schema";
import { api } from "@shared/routes";

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  processing: { label: "Processing", icon: Loader2, variant: "default" },
  completed: { label: "Completed", icon: CheckCircle, variant: "outline" },
  needs_info: { label: "Needs Info", icon: AlertCircle, variant: "destructive" },
  failed: { label: "Failed", icon: AlertCircle, variant: "destructive" },
};

export default function HomePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobType, setNewJobType] = useState("invoice");

  const { data: jobs, isLoading: jobsLoading } = useQuery<ExtractionJob[]>({
    queryKey: [api.jobs.list.path],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: { name: string; targetFormType: string }) => {
      const res = await apiRequest("POST", api.jobs.create.path, data);
      return res.json();
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      setDialogOpen(false);
      setNewJobName("");
      navigate(`/job/${job.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create job", variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      toast({ title: "Job deleted" });
    },
  });

  const handleCreateJob = () => {
    if (!newJobName.trim()) return;
    createJobMutation.mutate({ name: newJobName, targetFormType: newJobType });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold" data-testid="text-app-title">Document Intelligence</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline" data-testid="text-user-name">
                {user?.firstName || user?.email}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-page-title">Your Extraction Jobs</h2>
            <p className="text-muted-foreground">Create and manage document extraction projects</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-job">
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Extraction Job</DialogTitle>
                <DialogDescription>
                  Set up a new document extraction project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="job-name">Job Name</Label>
                  <Input
                    id="job-name"
                    placeholder="e.g., Q4 Invoices"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    data-testid="input-job-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-type">Form Type</Label>
                  <Select value={newJobType} onValueChange={setNewJobType}>
                    <SelectTrigger id="form-type" data-testid="select-form-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateJob}
                  disabled={!newJobName.trim() || createJobMutation.isPending}
                  data-testid="button-create-job"
                >
                  {createJobMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Create Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {jobsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const status = statusConfig[job.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={job.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => navigate(`/job/${job.id}`)}
                  data-testid={`card-job-${job.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{job.name}</CardTitle>
                        <CardDescription className="capitalize">{job.targetFormType}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJobMutation.mutate(job.id);
                        }}
                        data-testid={`button-delete-job-${job.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className={`w-3 h-3 ${job.status === "processing" ? "animate-spin" : ""}`} />
                      {status.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12" data-testid="card-empty-state">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No extraction jobs yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first job to start extracting data from documents
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-job">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
