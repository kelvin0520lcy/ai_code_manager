import { useState, useContext, useEffect } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, ArrowUpRight, Code, Eye, FileCode, RefreshCw, Terminal,
  CheckCircle2, XCircle, Info, BrainCircuit, ArrowRight, FileSearch,
  BookmarkCheck, Layers, Settings, Link, Key
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import cursorAIService from '@/lib/cursorAIService';
import { useToast } from '@/hooks/use-toast';

export default function AICodeManager() {
  const { 
    activeFile, files, logs, issues, tests,
    runTests, updateFileContent,
    setCursorAPIKey, connectToCursorEditor, isCursorEditorConnected
  } = useContext(ProjectContext);
  
  const [aiAnalysisTab, setAiAnalysisTab] = useState('issues');
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [editorHost, setEditorHost] = useState('localhost');
  const [editorPort, setEditorPort] = useState(8765);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // When the active file changes, analyze it
  useEffect(() => {
    if (activeFile && activeFile.type !== 'folder') {
      analyzeCurrentFile();
    }
  }, [activeFile]);

  // Analyze the current file for issues and suggestions
  const analyzeCurrentFile = async () => {
    if (!activeFile || activeFile.type === 'folder') {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Use our CursorAI service to analyze the code
      const analysis = await cursorAIService.updateCode(activeFile.id, activeFile.content);
      setFileAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze current file",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get file issues for the active file
  const getFileIssues = () => {
    if (!activeFile) return [];
    return issues.filter(issue => issue.fileId === activeFile.id);
  };

  // Get file tests for the active file
  const getFileTests = () => {
    if (!activeFile) return [];
    return tests.filter(test => test.fileId === activeFile.id);
  };

  // Get recent logs
  const getRecentLogs = () => {
    return logs.slice(-10).reverse();
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200';
    }
  };

  // Get log type badge color
  const getLogTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'log':
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  // Get test status badge color and icon
  const getTestStatusInfo = (status: string) => {
    switch (status) {
      case 'passed':
        return { 
          color: 'bg-green-100 text-green-800 hover:bg-green-200',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        };
      case 'failed':
        return { 
          color: 'bg-red-100 text-red-800 hover:bg-red-200',
          icon: <XCircle className="h-3.5 w-3.5 text-red-600" />
        };
      case 'running':
        return { 
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          icon: <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
        };
      case 'not_run':
      default:
        return { 
          color: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
          icon: <Info className="h-3.5 w-3.5 text-neutral-600" />
        };
    }
  };
  
  // Handle API key submission
  const handleSetApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setCursorAPIKey(apiKey);
    setApiKey(''); // Clear the input field
  };
  
  // Handle Cursor Editor connection
  const handleConnectToCursor = async () => {
    if (!editorHost.trim()) {
      toast({
        title: "Error",
        description: "Editor host cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      await connectToCursorEditor({
        host: editorHost,
        port: editorPort
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="p-4 pb-2 flex-row justify-between items-center">
        <CardTitle className="text-base flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          AI Coding Manager
          {isAnalyzing && (
            <RefreshCw className="h-4 w-4 text-primary animate-spin ml-2" />
          )}
        </CardTitle>
        
        {activeFile && activeFile.type !== 'folder' && (
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <FileCode className="h-3.5 w-3.5" />
            <span>{activeFile.name}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <Tabs 
          value={aiAnalysisTab} 
          onValueChange={setAiAnalysisTab}
          className="flex flex-col h-full"
        >
          <TabsList className="px-4 justify-start gap-1 h-auto bg-transparent pb-0 border-b border-neutral-200">
            <TabsTrigger 
              value="issues" 
              className="text-xs rounded-sm data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-b-none px-3 h-8"
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1" /> Issues
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="text-xs rounded-sm data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-b-none px-3 h-8"
            >
              <BookmarkCheck className="h-3.5 w-3.5 mr-1" /> Tests
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="text-xs rounded-sm data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-b-none px-3 h-8"
            >
              <Terminal className="h-3.5 w-3.5 mr-1" /> Logs
            </TabsTrigger>
            <TabsTrigger 
              value="aiInsights" 
              className="text-xs rounded-sm data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-b-none px-3 h-8"
            >
              <FileSearch className="h-3.5 w-3.5 mr-1" /> AI Insights
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-xs rounded-sm data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-b-none px-3 h-8"
            >
              <Settings className="h-3.5 w-3.5 mr-1" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="flex-1 pt-3 px-4 overflow-hidden m-0">
            {activeFile ? (
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {getFileIssues().length > 0 ? (
                    getFileIssues().map((issue, index) => (
                      <div 
                        key={index}
                        className="bg-white rounded-lg border p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium text-sm flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            {issue.title}
                          </h3>
                          <Badge 
                            variant="secondary"
                            className={getSeverityColor(issue.severity)}
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-600 mb-2">
                          {issue.description}
                        </p>
                        {issue.line && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1">
                            <Layers className="h-3 w-3" />
                            <span>Line {issue.line}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm">No issues detected in this file</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a file to view issues</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tests" className="flex-1 pt-3 px-4 overflow-hidden m-0">
            {activeFile ? (
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {getFileTests().length > 0 ? (
                    getFileTests().map((test, index) => {
                      const statusInfo = getTestStatusInfo(test.status);
                      return (
                        <div 
                          key={index}
                          className="bg-white rounded-lg border p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-medium text-sm flex items-center gap-1.5">
                              {statusInfo.icon}
                              {test.name}
                            </h3>
                            <Badge 
                              variant="secondary"
                              className={statusInfo.color}
                            >
                              {test.status}
                            </Badge>
                          </div>
                          
                          {test.result && (
                            <div className="bg-neutral-50 p-2 rounded text-xs text-neutral-800 mt-2 font-mono">
                              {test.result}
                            </div>
                          )}
                          
                          {test.details && (
                            <div className="mt-3 space-y-1">
                              {test.details.coverage !== undefined && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-neutral-600">Coverage:</span>
                                  <span className="font-medium">{test.details.coverage}%</span>
                                </div>
                              )}
                              
                              {test.details.executionTime !== undefined && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-neutral-600">Time:</span>
                                  <span className="font-medium">{test.details.executionTime}ms</span>
                                </div>
                              )}
                              
                              {test.details.assertions && test.details.assertions.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">Assertions:</div>
                                  <div className="space-y-1">
                                    {test.details.assertions.map((assertion, idx) => (
                                      <div 
                                        key={idx}
                                        className="flex items-center gap-1.5 text-xs"
                                      >
                                        {assertion.status === 'passed' ? (
                                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <XCircle className="h-3 w-3 text-red-600" />
                                        )}
                                        <span>{assertion.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex justify-end mt-2">
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                              onClick={() => runTests(test.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Run Test
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <BookmarkCheck className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm">No tests available for this file</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a file to view tests</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs" className="flex-1 pt-3 px-4 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {getRecentLogs().length > 0 ? (
                  getRecentLogs().map((log, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-lg border p-2 text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="secondary"
                          className={getLogTypeColor(log.type)}
                        >
                          {log.type}
                        </Badge>
                        <span className="text-neutral-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-mono whitespace-pre-wrap break-words">
                        {log.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-neutral-500">
                    <Terminal className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm">No logs available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="aiInsights" className="flex-1 pt-3 px-4 overflow-hidden m-0">
            <ScrollArea className="h-full">
              {activeFile && activeFile.type !== 'folder' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                      <BrainCircuit className="h-4 w-4 text-purple-600" />
                      AI Analysis
                    </h3>
                    <button 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      onClick={analyzeCurrentFile}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  
                  {isAnalyzing ? (
                    <div className="text-center py-4 text-neutral-500">
                      <RefreshCw className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Analyzing code...</p>
                    </div>
                  ) : fileAnalysis ? (
                    <div className="space-y-3">
                      {fileAnalysis.issues && fileAnalysis.issues.length > 0 ? (
                        <div>
                          <h4 className="text-xs font-medium mb-2 text-neutral-700">
                            Detected Issues:
                          </h4>
                          <div className="space-y-2">
                            {fileAnalysis.issues.map((issue: any, index: number) => (
                              <div 
                                key={index}
                                className="bg-white rounded-lg border p-2.5 shadow-sm"
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-medium text-xs flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                    {issue.title}
                                  </h3>
                                  <Badge 
                                    variant="secondary"
                                    className={getSeverityColor(issue.severity)}
                                  >
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-xs text-neutral-600">
                                  {issue.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg border p-3 shadow-sm">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Code looks good!</span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-1">
                            No significant issues detected in the current file.
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border p-3 shadow-sm">
                        <h4 className="text-xs font-medium mb-2 flex items-center text-purple-800 gap-1.5">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          AI Suggestions:
                        </h4>
                        <div className="space-y-2 text-xs text-neutral-700">
                          <p>
                            Consider implementing proper input validation to make the code more robust.
                          </p>
                          <p>
                            Add comprehensive error handling to improve user experience.
                          </p>
                          <Separator className="my-2" />
                          <div className="flex items-center gap-1 text-purple-600">
                            <ArrowRight className="h-3 w-3" />
                            <span>Use PromptGenerator to get AI assistance with implementing these suggestions.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      <FileSearch className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm">Click Refresh to analyze this file</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a file for AI analysis</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="settings" className="flex-1 pt-3 px-4 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                    <Settings className="h-4 w-4 text-primary" />
                    Cursor AI Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-amber-600" />
                        API Key Configuration
                      </h4>
                      <div className="mb-4">
                        <p className="text-xs text-neutral-600 mb-2">
                          Enter your Cursor AI API key to enable enhanced code generation capabilities.
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="Enter API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button 
                            size="sm" 
                            onClick={handleSetApiKey}
                            className="text-xs h-8"
                          >
                            Save Key
                          </Button>
                        </div>
                      </div>
                      
                      <h4 className="text-xs font-medium my-2 flex items-center gap-1.5">
                        <Link className="h-3.5 w-3.5 text-blue-600" />
                        Cursor Editor Connection
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2">
                        Connect directly to the Cursor Editor for seamless integration.
                      </p>
                      
                      <div className="grid grid-cols-5 gap-2">
                        <div className="col-span-3">
                          <label className="text-xs text-neutral-600 block mb-1">Host</label>
                          <Input
                            placeholder="localhost"
                            value={editorHost}
                            onChange={(e) => setEditorHost(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-neutral-600 block mb-1">Port</label>
                          <Input
                            type="number"
                            placeholder="8765"
                            value={editorPort.toString()}
                            onChange={(e) => setEditorPort(parseInt(e.target.value) || 8765)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5">
                          <Badge 
                            variant="secondary"
                            className={isCursorEditorConnected ? 
                              'bg-green-100 text-green-800 hover:bg-green-200' : 
                              'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                            }
                          >
                            {isCursorEditorConnected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleConnectToCursor}
                          disabled={isConnecting}
                          className="text-xs h-8"
                        >
                          {isConnecting ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link className="h-3 w-3 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border p-3 shadow-sm">
                      <h4 className="text-xs font-medium mb-2 text-blue-800">About Cursor AI Integration</h4>
                      <p className="text-xs text-neutral-700">
                        Cursor AI integration provides advanced code generation, analysis, and error detection capabilities to enhance your development workflow. 
                        Connect directly to your Cursor Editor instance for live coding assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}