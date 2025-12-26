import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Trash2,
  Play,
  Send,
  Loader2,
  CheckCircle,
  Bot,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import type { JobWithDetails } from "@shared/schema";
import { formFieldDefinitions } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-400" },
  uploading: { label: "Uploading", color: "bg-blue-400" },
  processing: { label: "Processing", color: "bg-yellow-400" },
  completed: { label: "Completed", color: "bg-green-400" },
  needs_info: { label: "Needs Info", color: "bg-orange-400" },
  failed: { label: "Failed", color: "bg-red-400" },
};

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: job, isLoading, refetch } = useQuery<JobWithDetails>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === "processing" ? 2000 : false;
    },
  });

  useEffect(() => {
    if (job?.extractedData) {
      setFormData(job.extractedData);
    }
  }, [job?.extractedData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job?.messages]);

  const { uploadFile, isUploading, progress: uploadProgress } = useUpload({
    onSuccess: async (response) => {
      await addDocumentMutation.mutateAsync({
        filename: response.metadata.name,
        objectPath: response.objectPath,
        mimeType: response.metadata.contentType,
      });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (data: { filename: string; objectPath: string; mimeType: string }) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/documents`, data);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Document added" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: number) => {
      await apiRequest("DELETE", `/api/jobs/${jobId}/documents/${docId}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const processJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/process`);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Processing started" });
    },
    onError: () => {
      toast({ title: "Failed to start processing", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setMessageInput("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const updateFormDataMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}/data`, { extractedData: data });
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Data saved" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    e.target.value = "";
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleFormChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveForm = () => {
    updateFormDataMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">Job not found</h2>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const fields = formFieldDefinitions[job.targetFormType] || formFieldDefinitions.custom;
  const status = statusConfig[job.status] || statusConfig.pending;
  const completedDocs = job.documents.filter((d) => d.status === "completed").length;
  const processingProgress = job.documents.length > 0
    ? Math.round((completedDocs / job.documents.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold" data-testid="text-job-name">{job.name}</h1>
              <p className="text-xs text-muted-foreground capitalize">{job.targetFormType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-4 p-4 h-[calc(100vh-4rem)]">
        <Card className="flex flex-col overflow-hidden" data-testid="panel-documents">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Upload PDFs or images to extract data
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <label className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
                data-testid="input-file-upload"
              />
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PDF or images</p>
                </>
              )}
            </label>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {job.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents yet
                  </p>
                ) : (
                  job.documents.map((doc) => {
                    const docStatus = statusConfig[doc.status] || statusConfig.pending;
                    const isImage = doc.mimeType.startsWith("image/");
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        data-testid={`document-item-${doc.id}`}
                      >
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          {isImage ? (
                            <Image className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.filename}</p>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${docStatus.color}`} />
                            <span className="text-xs text-muted-foreground">{docStatus.label}</span>
                            {doc.documentType && (
                              <Badge variant="secondary" className="text-xs">
                                {doc.documentType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          data-testid={`button-delete-doc-${doc.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {job.documents.length > 0 && job.status !== "processing" && (
              <Button
                onClick={() => processJobMutation.mutate()}
                disabled={processJobMutation.isPending}
                className="w-full"
                data-testid="button-process"
              >
                {processJobMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Extract Data
              </Button>
            )}

            {job.status === "processing" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden" data-testid="panel-form">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Extracted Data
            </CardTitle>
            <CardDescription>
              Review and edit the extracted information
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {fields.map((field) => {
                  const value = formData[field.key];
                  const isMissing = job.missingFields?.includes(field.key);
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label
                        htmlFor={field.key}
                        className={`flex items-center gap-2 ${isMissing ? "text-destructive" : ""}`}
                      >
                        {field.name}
                        {field.required && <span className="text-destructive">*</span>}
                        {isMissing && (
                          <Badge variant="destructive" className="text-xs">
                            Missing
                          </Badge>
                        )}
                      </Label>
                      {field.key === "lineItems" || field.key === "items" || field.key === "keyTerms" || field.key === "keyInfo" ? (
                        <Textarea
                          id={field.key}
                          value={typeof value === "string" ? value : JSON.stringify(value || "", null, 2)}
                          onChange={(e) => handleFormChange(field.key, e.target.value)}
                          className="min-h-[80px]"
                          data-testid={`input-field-${field.key}`}
                        />
                      ) : (
                        <Input
                          id={field.key}
                          value={String(value || "")}
                          onChange={(e) => handleFormChange(field.key, e.target.value)}
                          className={isMissing ? "border-destructive" : ""}
                          data-testid={`input-field-${field.key}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Button
              onClick={handleSaveForm}
              disabled={updateFormDataMutation.isPending}
              data-testid="button-save-form"
            >
              {updateFormDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden" data-testid="panel-chat">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Ask questions or provide missing information
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {job.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Upload documents and start extraction to chat with the AI assistant
                    </p>
                  </div>
                ) : (
                  job.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`flex-1 rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
