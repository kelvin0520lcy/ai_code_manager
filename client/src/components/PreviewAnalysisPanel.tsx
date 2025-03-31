import { useState } from 'react';
import { PreviewAnalysisResponse } from '../lib/aiPreviewAnalysisService';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clipboard, Send, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { ProjectContext } from '../contexts/ProjectContext';
import { useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PreviewAnalysisProps {
  isVisible: boolean;
  analysis: PreviewAnalysisResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function PreviewAnalysisPanel({ 
  isVisible, 
  analysis, 
  isLoading, 
  onClose 
}: PreviewAnalysisProps) {
  const { sendPromptToCursor, isCursorEditorConnected } = useContext(ProjectContext);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('issues');

  if (!isVisible) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The code snippet has been copied to your clipboard.",
        variant: "default",
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  const sendToCursor = () => {
    if (!analysis?.cursorPrompt) return;
    
    if (!isCursorEditorConnected) {
      toast({
        title: "Cursor Editor Not Connected",
        description: "Please connect to Cursor Editor in the settings panel first.",
        variant: "destructive",
      });
      return;
    }
    
    sendPromptToCursor(analysis.cursorPrompt);
    toast({
      title: "Sent to Cursor AI",
      description: "The analysis prompt has been sent to Cursor AI.",
      variant: "default",
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">{severity}</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">{severity}</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{severity}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">{priority}</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{priority}</Badge>;
      case 'low':
        return <Badge variant="outline">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-lg font-semibold">Analyzing preview content...</p>
      <p className="text-sm text-muted-foreground">This may take a few moments</p>
    </div>
  );

  const renderAnalysis = () => {
    if (!analysis) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-lg font-semibold">No analysis available</p>
          <p className="text-sm text-muted-foreground">Try refreshing the preview or analyzing again</p>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
          <p className="text-sm mb-4">{analysis.analysis.summary}</p>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="issues">
                Issues ({analysis.analysis.issues.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions ({analysis.analysis.suggestions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                {analysis.analysis.issues.map((issue, index) => (
                  <AccordionItem key={index} value={`issue-${index}`}>
                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 text-left">
                        {getSeverityIcon(issue.severity)}
                        <span className="font-medium">{issue.type}</span>
                        <div className="ml-auto">{getSeverityBadge(issue.severity)}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-2">
                      <p className="mb-2">{issue.description}</p>
                      {issue.codeLocation && (
                        <div className="bg-muted p-2 rounded-md mt-2 relative">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                            <code>{issue.codeLocation}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => copyToClipboard(issue.codeLocation || '')}
                          >
                            <Clipboard className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                {analysis.analysis.suggestions.map((suggestion, index) => (
                  <AccordionItem key={index} value={`suggestion-${index}`}>
                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 text-left">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{suggestion.description}</span>
                        <div className="ml-auto">{getPriorityBadge(suggestion.priority)}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-2">
                      {suggestion.codeSnippet && (
                        <div className="bg-muted p-2 rounded-md mt-2 relative">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                            <code>{suggestion.codeSnippet}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => copyToClipboard(suggestion.codeSnippet || '')}
                          >
                            <Clipboard className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button 
              onClick={sendToCursor} 
              disabled={!isCursorEditorConnected}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send to Cursor AI
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative w-full max-w-3xl h-[80vh] bg-background border rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Preview Analysis</h2>
        </div>
        <div className="p-0 h-[calc(80vh-130px)] overflow-hidden">
          {isLoading ? renderLoading() : renderAnalysis()}
        </div>
      </div>
    </div>
  );
}