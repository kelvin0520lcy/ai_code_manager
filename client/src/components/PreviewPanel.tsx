import { useContext, useRef, useState, useEffect } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Wand, AlertTriangle, Check, Brain, BrainCircuit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { 
  captureDOMSnapshot, 
  captureScreenshot, 
  analyzePreview, 
  sendAnalysisToCursor,
  PreviewAnalysisResponse
} from '@/lib/aiPreviewAnalysisService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import PreviewAnalysisPanel from './PreviewAnalysisPanel';

export default function PreviewPanel() {
  const { 
    activeFile, 
    cursorStatus, 
    isCursorEditorConnected,
    isAutonomousMode,
    toggleAutonomousMode,
    autonomousStatus
  } = useContext(ProjectContext);
  
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PreviewAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [isFullscreenAnalysisVisible, setIsFullscreenAnalysisVisible] = useState(false);

  // Effect to connect the iframe to the autonomous agent when it loads
  useEffect(() => {
    // Import the autonomous agent dynamically to avoid circular dependencies
    import('@/lib/autonomousAgent').then(({ autonomousAgent }) => {
      if (iframeRef.current) {
        autonomousAgent.setPreviewFrame(iframeRef.current);
      }
    }).catch(error => {
      console.error("Failed to import autonomous agent:", error);
    });
  }, [iframeRef.current]);

  const handleRefresh = () => {
    if (iframeRef.current && activeFile && activeFile.type.includes('html')) {
      const iframe = iframeRef.current;
      iframe.srcdoc = activeFile.content;
    }
  };

  const handleAnalyzePreview = async () => {
    if (!activeFile) {
      toast({
        title: "No active file",
        description: "Please select a file to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (!activeFile.type.includes('html')) {
      toast({
        title: "Unsupported file type",
        description: "Currently, only HTML files can be analyzed.",
        variant: "destructive",
      });
      return;
    }

    if (!iframeRef.current) {
      toast({
        title: "Preview not loaded",
        description: "Please wait for the preview to load before analyzing.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('analysis');

    try {
      // Capture DOM content for analysis
      const domSnapshot = captureDOMSnapshot(iframeRef.current);
      
      // Capture screenshot if possible
      let screenshotBase64 = null;
      try {
        // Convert iframe to canvas and get base64 data
        const canvas = await html2canvas(iframeRef.current.contentDocument?.body || iframeRef.current);
        screenshotBase64 = canvas.toDataURL('image/png').split(',')[1]; // Get base64 without prefix
      } catch (screenshotError) {
        console.warn("Could not capture screenshot:", screenshotError);
      }

      // Send to server for analysis
      const result = await analyzePreview({
        htmlContent: activeFile.content,
        screenshotBase64: screenshotBase64 || undefined,
        analysisGoal: 'general'
      });

      setAnalysisResult(result);
      
      toast({
        title: "Analysis complete",
        description: "AI has analyzed your preview and provided feedback.",
      });
    } catch (error) {
      console.error("Error during preview analysis:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendToCursor = async () => {
    if (!analysisResult || !activeFile) return;
    
    if (!isCursorEditorConnected) {
      toast({
        title: "Cursor not connected",
        description: "Please connect to Cursor editor in the AI settings before sending analysis.",
        variant: "destructive",
      });
      return;
    }

    // Make sure we have a cursor prompt
    if (!analysisResult.cursorPrompt) {
      toast({
        title: "Missing prompt",
        description: "No cursor prompt was generated for this analysis.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await sendAnalysisToCursor(
        analysisResult.cursorPrompt,
        activeFile.content
      );
      
      if (success) {
        toast({
          title: "Sent to Cursor AI",
          description: "Analysis has been sent to Cursor for processing.",
        });
      } else {
        throw new Error("Failed to send to Cursor");
      }
    } catch (error) {
      toast({
        title: "Failed to send to Cursor",
        description: "There was an error communicating with Cursor AI.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Card className="w-full h-64">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Preview</span>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isAutonomousMode ? "default" : "ghost"}
                      size="icon" 
                      className={`h-6 w-6 ${isAutonomousMode ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                      onClick={toggleAutonomousMode}
                      disabled={!isCursorEditorConnected}
                    >
                      <BrainCircuit className="h-4 w-4" />
                      {autonomousStatus === 'running' && 
                        <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAutonomousMode ? 'Disable' : 'Enable'} Autonomous Mode</p>
                    {!isCursorEditorConnected && <p className="text-xs text-red-500">Requires Cursor connection</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh preview</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={handleAnalyzePreview}
                      disabled={isAnalyzing || !activeFile}
                    >
                      <Wand className="h-4 w-4" />
                      {isAnalyzing && <span className="absolute top-0 right-0 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Analyze with AI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => analysisResult && setIsFullscreenAnalysisVisible(true)}
                      disabled={!analysisResult}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximize analysis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-48px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="px-4 pt-2 bg-transparent border-b">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="analysis" disabled={!analysisResult && !isAnalyzing}>
                Analysis
                {analysisResult && analysisResult.analysis.issues && (
                  <Badge variant="outline" className="ml-2 bg-blue-50">
                    {analysisResult.analysis.issues.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="p-4 h-[calc(100%-40px)] data-[state=active]:flex flex-col">
              {activeFile ? (
                <div className="text-sm h-full">
                  {activeFile.type.includes('javascript') || activeFile.type.includes('typescript') ? (
                    <div className="font-mono p-2 bg-neutral-50 rounded border border-neutral-200 h-full">
                      <p>JavaScript/TypeScript execution results would appear here.</p>
                    </div>
                  ) : activeFile.type.includes('html') ? (
                    <div className="border border-neutral-200 rounded p-2 h-full">
                      <iframe
                        ref={iframeRef}
                        title="HTML Preview"
                        srcDoc={activeFile.content}
                        className="w-full h-full"
                        sandbox="allow-scripts"
                      />
                    </div>
                  ) : (
                    <div className="text-neutral-500 flex items-center justify-center h-full">
                      No preview available for this file type
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-neutral-500 flex items-center justify-center h-full">
                  Select a file to preview
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analysis" className="h-[calc(100%-40px)] data-[state=active]:flex flex-col">
              {isAnalyzing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-neutral-600">Analyzing preview with AI...</p>
                  </div>
                </div>
              ) : analysisResult ? (
                <div className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">AI Analysis Results</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleSendToCursor}
                      disabled={!isCursorEditorConnected}
                      className="text-xs h-7"
                    >
                      <Wand className="h-3 w-3 mr-1" />
                      Send to Cursor AI
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium mb-2 text-neutral-600">Summary</h4>
                        <p className="text-sm">{analysisResult.analysis.summary}</p>
                      </div>
                      
                      {analysisResult.analysis.issues && analysisResult.analysis.issues.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium mb-2 text-neutral-600">Issues</h4>
                          <div className="space-y-2">
                            {analysisResult.analysis.issues.map((issue, index) => (
                              <div key={index} className="text-xs p-2 border rounded bg-amber-50 border-amber-200">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-amber-800">{issue.severity}</p>
                                    <p className="mt-0.5 text-neutral-700">{issue.description}</p>
                                    {issue.element && (
                                      <code className="mt-1 block text-[10px] bg-white p-1 rounded border border-amber-100">
                                        {issue.element}
                                      </code>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysisResult.analysis.suggestions && analysisResult.analysis.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium mb-2 text-neutral-600">Suggestions</h4>
                          <div className="space-y-2">
                            {analysisResult.analysis.suggestions.map((suggestion, index) => (
                              <div key={index} className="text-xs p-2 border rounded bg-emerald-50 border-emerald-200">
                                <div className="flex items-start gap-2">
                                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="mt-0.5 text-neutral-700">{suggestion.description}</p>
                                    {suggestion.code && (
                                      <code className="mt-1 block text-[10px] bg-white p-1 rounded border border-emerald-100">
                                        {suggestion.code}
                                      </code>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <p className="text-[11px] text-neutral-500">
                          Cursor prompt has been generated and is ready to be sent to the Cursor editor.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
                  Click the magic wand button to analyze the preview with AI
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Full-screen analysis panel */}
      <PreviewAnalysisPanel
        isVisible={isFullscreenAnalysisVisible}
        analysis={analysisResult}
        isLoading={isAnalyzing}
        onClose={() => setIsFullscreenAnalysisVisible(false)}
      />
    </div>
  );
}