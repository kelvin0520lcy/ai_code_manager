import { useContext, useState, useEffect } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, Wand2, Book, Zap, Send, Lightbulb, History, ThumbsUp, 
  ThumbsDown, ArrowUpRight, Code, AlertTriangle, Search, BrainCircuit 
} from 'lucide-react';
import cursorAIService, { CursorPromptHistoryItem } from '@/lib/cursorAIService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PromptGenerator() {
  const { sendPromptToCursor, cursorStatus, activeFile, issues } = useContext(ProjectContext);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');
  const [processingPrompt, setProcessingPrompt] = useState(false);
  const [promptHistoryItems, setPromptHistoryItems] = useState<CursorPromptHistoryItem[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [similarPrompts, setSimilarPrompts] = useState<CursorPromptHistoryItem[]>([]);
  const { toast } = useToast();

  // Enhanced predefined prompt templates
  const promptTemplates = [
    {
      title: 'Fix Bugs',
      description: 'Identify and repair bugs in the code',
      template: 'Please identify and fix the following issues in this code:',
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />
    },
    {
      title: 'Add Documentation',
      description: 'Generate clean, comprehensive documentation',
      template: 'Please add comprehensive documentation to this code following best practices:',
      icon: <Book className="h-4 w-4 text-blue-500" />
    },
    {
      title: 'Optimize Performance',
      description: 'Improve execution speed and efficiency',
      template: 'Please optimize this code for better performance by addressing inefficient patterns:',
      icon: <Zap className="h-4 w-4 text-yellow-500" />
    },
    {
      title: 'Refactor',
      description: 'Improve code structure and readability',
      template: 'Please refactor this code to improve readability and maintainability:',
      icon: <Lightbulb className="h-4 w-4 text-purple-500" />
    },
    {
      title: 'Implement Feature',
      description: 'Create new functionality based on requirements',
      template: 'Please implement the following feature:',
      icon: <Code className="h-4 w-4 text-green-500" />
    },
    {
      title: 'Analyze & Suggest',
      description: 'Review code and recommend improvements',
      template: 'Please analyze this code and suggest improvements:',
      icon: <Search className="h-4 w-4 text-indigo-500" />
    }
  ];

  // Load prompt history and update suggestions when file changes
  useEffect(() => {
    // Load prompt history
    const history = cursorAIService.getPromptHistory();
    setPromptHistoryItems(history);

    // Generate smart suggestions based on active file
    if (activeFile && activeFile.content) {
      const suggestions = cursorAIService.getSuggestions(activeFile.content, '');
      setSmartSuggestions(suggestions);
    }
  }, [activeFile]);

  // Update suggestions when prompt changes
  useEffect(() => {
    if (prompt.trim().length > 10 && activeFile) {
      // Get similar prompts
      const similar = cursorAIService.getSimilarPrompts(prompt);
      setSimilarPrompts(similar);
      
      // Update smart suggestions based on prompt content
      const suggestions = cursorAIService.getSuggestions(activeFile.content, prompt);
      setSmartSuggestions(suggestions);
    } else {
      setSimilarPrompts([]);
    }
  }, [prompt, activeFile]);

  // Generate a template including file context and issues
  const handleSelectTemplate = (template: string) => {
    let newPrompt = template;
    
    // Add file context
    if (activeFile) {
      newPrompt += `\n\nFile: ${activeFile.name}\n`;
      
      // If we're fixing bugs, include known issues
      if (template.includes('fix') && issues.length > 0) {
        const fileIssues = issues.filter(issue => issue.fileId === activeFile.id);
        if (fileIssues.length > 0) {
          newPrompt += '\nKnown issues:\n';
          fileIssues.forEach(issue => {
            newPrompt += `- ${issue.title}: ${issue.description}\n`;
          });
        }
      }
      
      // Include code snippet for context
      if (activeFile.content && activeFile.type !== 'folder') {
        // Limit to first 20 lines to avoid overly large prompts
        const contentLines = activeFile.content.split('\n').slice(0, 20);
        newPrompt += '\nCode context (first 20 lines):\n```\n';
        newPrompt += contentLines.join('\n');
        if (activeFile.content.split('\n').length > 20) {
          newPrompt += '\n... (additional code truncated) ...';
        }
        newPrompt += '\n```\n';
      }
    }
    
    setPrompt(newPrompt);
  };

  // Send prompt to Cursor AI with enhanced handling
  const handleSendPrompt = async () => {
    if (!prompt.trim() || !activeFile || activeFile.type === 'folder') {
      toast({
        title: "Error",
        description: "Please select a file and enter a valid prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPrompt(true);
      
      // Update UI to show processing
      sendPromptToCursor(prompt); // Update the context status
      
      // Use our enhanced service to send the prompt
      const response = await cursorAIService.sendPrompt(
        prompt, 
        activeFile.id, 
        activeFile.content
      );
      
      // Handle response
      if (response.success) {
        toast({
          title: "Prompt Processed",
          description: "Cursor AI has processed your request",
          className: "border-l-4 border-green-500",
        });
        
        // If we got file changes, update through context
        if (response.fileChanges) {
          // This will be handled by ProjectContext
        }
        
        // Refresh history
        setPromptHistoryItems(cursorAIService.getPromptHistory());
        
        // Clear prompt on success (optional)
        // setPrompt('');
      }
    } catch (error: any) {
      toast({
        title: "Prompt Error",
        description: error.message || "Failed to process prompt",
        variant: "destructive",
      });
    } finally {
      setProcessingPrompt(false);
    }
  };

  // Record user feedback on a prompt
  const handleFeedback = (promptId: string, isPositive: boolean) => {
    cursorAIService.recordFeedback(promptId, isPositive);
    
    toast({
      title: "Feedback Recorded",
      description: "Thank you for your feedback!",
      className: "border-l-4 border-blue-500",
    });
  };

  // Apply a suggestion to the prompt area
  const handleApplySuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // Use a previous prompt
  const handleUsePrompt = (previousPrompt: string) => {
    setPrompt(previousPrompt);
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="mb-3 p-1 bg-neutral-100 rounded-md self-start">
          <TabsTrigger value="suggestions" className="text-xs rounded-sm">
            <Sparkles className="h-3 w-3 mr-1" /> Templates
          </TabsTrigger>
          <TabsTrigger value="smart" className="text-xs rounded-sm">
            <BrainCircuit className="h-3 w-3 mr-1" /> Smart
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs rounded-sm">
            <History className="h-3 w-3 mr-1" /> History
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs rounded-sm">
            <Wand2 className="h-3 w-3 mr-1" /> Write
          </TabsTrigger>
        </TabsList>

        {/* Template suggestions tab */}
        <TabsContent value="suggestions" className="h-full flex flex-col m-0">
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
              {promptTemplates.map((template, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectTemplate(template.template)}
                >
                  <CardContent className="p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      {template.icon}
                      {template.title}
                    </div>
                    <p className="text-xs text-neutral-600">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* AI-generated smart suggestions tab */}
        <TabsContent value="smart" className="h-full flex flex-col m-0">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 p-2">
              <div className="text-sm font-medium text-neutral-700">Smart Suggestions</div>
              <p className="text-xs text-neutral-500 mb-1">
                AI-generated suggestions based on your active file and past successes:
              </p>
              
              {smartSuggestions.length > 0 ? (
                smartSuggestions.map((suggestion, index) => (
                  <Card key={index} className="bg-gradient-to-tr from-slate-50 to-blue-50">
                    <CardContent className="p-3 pt-4">
                      <p className="text-sm">{suggestion}</p>
                    </CardContent>
                    <CardFooter className="p-2 pt-0 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        <ArrowUpRight className="h-3 w-3 mr-1" /> Use
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center p-4 text-neutral-400">
                  No smart suggestions available yet.
                  <br />
                  Try writing more prompts or selecting a file.
                </div>
              )}
              
              {similarPrompts.length > 0 && (
                <>
                  <Separator className="my-2" />
                  
                  <div className="text-sm font-medium text-neutral-700 mt-2">
                    Similar Successful Prompts
                  </div>
                  <p className="text-xs text-neutral-500 mb-1">
                    Previously successful prompts that are similar to what you're writing:
                  </p>
                  
                  {similarPrompts.map((item, index) => (
                    <Card key={index} className="bg-gradient-to-tr from-slate-50 to-green-50">
                      <CardContent className="p-3 pt-4">
                        <p className="text-sm font-medium">{item.prompt}</p>
                        {item.result && (
                          <div className="mt-2 text-xs text-neutral-600 bg-white p-2 rounded border">
                            <span className="font-medium">Result:</span> {item.result.responseSnippet}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-2 pt-0 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleUsePrompt(item.prompt)}
                        >
                          <ArrowUpRight className="h-3 w-3 mr-1" /> Use
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Prompt history tab */}
        <TabsContent value="history" className="h-full flex flex-col m-0">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 p-2">
              <div className="text-sm font-medium text-neutral-700">Prompt History</div>
              
              {promptHistoryItems.length > 0 ? (
                promptHistoryItems.slice().reverse().map((item, index) => (
                  <Card key={index} className={item.result?.success ? 
                    "border-l-4 border-green-500" : 
                    item.result ? "border-l-4 border-amber-500" : ""}
                  >
                    <CardContent className="p-3 pt-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium break-words">{item.prompt.length > 100 
                          ? item.prompt.substring(0, 100) + '...' 
                          : item.prompt}
                        </p>
                        <Badge variant={item.result?.success ? "default" : "secondary"} className="ml-2 shrink-0">
                          {item.result?.success ? "Success" : item.result ? "Failed" : "Pending"}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1 text-xs text-neutral-500 mt-1">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        {item.fileId && <span>• File ID: {item.fileId}</span>}
                      </div>
                      
                      {item.result && (
                        <div className="mt-2 p-2 bg-neutral-50 rounded text-xs">
                          {item.result.responseSnippet}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-2 pt-0 flex justify-between">
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleFeedback(item.id, true)}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleFeedback(item.id, false)}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleUsePrompt(item.prompt)}
                      >
                        <ArrowUpRight className="h-3 w-3 mr-1" /> Use Again
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center p-4 text-neutral-400">
                  No prompt history available yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Custom prompt writing tab */}
        <TabsContent value="custom" className="h-full flex flex-col m-0 p-2">
          <div className="text-sm font-medium text-neutral-700 mb-2">Write Custom Prompt</div>
          <p className="text-xs text-neutral-600 mb-3">
            Write a detailed prompt for Cursor AI to execute. Be specific about what you want to achieve.
          </p>
          
          {activeFile && activeFile.type !== 'folder' ? (
            <div className="flex items-center text-xs text-neutral-500 mb-3 p-2 bg-neutral-50 rounded">
              <Code className="h-3 w-3 mr-1" />
              <span>Current file: <span className="font-medium">{activeFile.name}</span></span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Please select a file (not a folder) before sending a prompt</span>
            </div>
          )}
          
          <div className="flex-1">
            <Textarea 
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              placeholder="Enter your prompt for Cursor AI..."
              className="min-h-[180px] h-full text-sm"
            />
          </div>
        </TabsContent>

        {/* Prompt input and send button */}
        <div className="mt-auto p-2 border-t">
          {activeTab !== 'custom' && (
            <Textarea 
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              placeholder="Enter your prompt for Cursor AI..."
              className="min-h-[80px] mb-2 text-sm"
            />
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-500">
              {processingPrompt || cursorStatus === 'processing' ? (
                <span className="flex items-center">
                  <Zap className="h-3 w-3 mr-1 animate-pulse" /> Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" /> Ready
                </span>
              )}
            </div>
            <Button 
              onClick={handleSendPrompt}
              disabled={!prompt.trim() || processingPrompt || cursorStatus === 'processing' || !activeFile || activeFile.type === 'folder'}
              className="gap-1"
            >
              <Send className="h-4 w-4" /> Send to Cursor
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}