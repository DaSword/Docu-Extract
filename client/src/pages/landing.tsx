import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Zap, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" data-testid="text-title">
            Document Intelligence
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8" data-testid="text-description">
            Extract and synthesize structured information from multiple documents using AI. 
            Upload PDFs, images, invoices, or contracts - we'll do the rest.
          </p>
          <Button size="lg" asChild data-testid="button-login">
            <a href="/api/login">Get Started</a>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <Card className="text-center" data-testid="card-feature-upload">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Multi-File Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload multiple documents at once - PDFs, images, and scanned files.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-feature-extract">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Smart Extraction</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI identifies document types and extracts relevant fields automatically.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-feature-realtime">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-lg">Real-Time Status</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track extraction progress live as your documents are processed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-feature-chat">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with our AI to clarify missing info or answer questions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">Supported document types</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-card border rounded-lg text-sm">Invoices</span>
            <span className="px-4 py-2 bg-card border rounded-lg text-sm">Contracts</span>
            <span className="px-4 py-2 bg-card border rounded-lg text-sm">Receipts</span>
            <span className="px-4 py-2 bg-card border rounded-lg text-sm">PDFs</span>
            <span className="px-4 py-2 bg-card border rounded-lg text-sm">Images</span>
          </div>
        </div>
      </div>
    </div>
  );
}
