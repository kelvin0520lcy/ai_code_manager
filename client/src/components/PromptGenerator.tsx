import { useContext, useState } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Wand2, Book, Zap, Send, Lightbulb } from 'lucide-react';

export default function PromptGenerator() {
  const { sendPromptToCursor, cursorStatus, activeFile } = useContext(ProjectContext);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');

  // Predefined prompt templates
  const promptTemplates = [
    {
      title: 'Fix Bugs',
      description: 'Fix bugs in the selected code',
      template: 'Please identify and fix any bugs in this code:',
      icon: <Wand2 className="h-4 w-4" />
    },
    {
      title: 'Add Documentation',
      description: 'Generate documentation for the code',
      template: 'Please add comprehensive documentation to this code:',
      icon: <Book className="h-4 w-4" />
    },
    {
      title: 'Optimize',
      description: 'Optimize the code for better performance',
      template: 'Please optimize this code for better performance:',
      icon: <Zap className="h-4 w-4" />
    },
    {
      title: 'Refactor',
      description: 'Refactor code for improved readability',
      template: 'Please refactor this code to improve readability and maintainability:',
      icon: <Lightbulb className="h-4 w-4" />
    }
  ];

  const handleSelectTemplate = (template: string) => {
    setPrompt(template + '\n\n' + (activeFile ? `File: ${activeFile.name}\n\n` : ''));
  };

  const handleSendPrompt = () => {
    if (prompt.trim()) {
      sendPromptToCursor(prompt);
      // Optional: clear prompt after sending
      // setPrompt('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="mb-3 p-1 bg-neutral-100 rounded-md self-start">
          <TabsTrigger value="suggestions" className="text-xs rounded-sm">
            <Sparkles className="h-3 w-3 mr-1" /> Suggestions
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs rounded-sm">
            <Wand2 className="h-3 w-3 mr-1" /> Custom
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="custom" className="h-full m-0">
          <div className="text-xs text-neutral-600 mb-2">
            Type your custom prompt for Cursor AI:
          </div>
        </TabsContent>

        <div className="mt-auto p-2 border-t">
          <Textarea 
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            placeholder="Enter your prompt for Cursor AI..."
            className="min-h-[80px] mb-2 text-sm"
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-500">
              {cursorStatus === 'processing' ? 'Processing...' : 'Ready'}
            </div>
            <Button 
              onClick={handleSendPrompt}
              disabled={!prompt.trim() || cursorStatus === 'processing'}
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