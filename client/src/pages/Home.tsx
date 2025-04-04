import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import AppHeader from "@/components/AppHeader";
import FileExplorer from "@/components/FileExplorer";
import CodeEditor from "@/components/CodeEditor";
import PreviewPanel from "@/components/PreviewPanel";
import ConsolePanel from "@/components/ConsolePanel";
import PromptGenerator from "@/components/PromptGenerator";
import TestingPanel from "@/components/TestingPanel";
import VersionControlPanel from "@/components/VersionControlPanel";
import StatusBar from "@/components/StatusBar";
import Toast from "@/components/Toast";
import AICodeManager from "@/components/AICodeManager";

export default function Home() {
  const [activeTab, setActiveTab] = useState("prompts");
  const [rightPanelTab, setRightPanelTab] = useState("aimanager");

  return (
    <div className="flex flex-col h-screen bg-neutral-50 font-sans text-neutral-900 overflow-auto">
      <AppHeader />
      
      <div className="flex-1 p-4 flex flex-col lg:flex-row gap-4">
        {/* Left column - Files */}
        <div className="w-full lg:w-64 flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-auto">
          <FileExplorer />
        </div>

        {/* Center column - Code Editor and Preview */}
        <div className="flex-1 flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-auto">
          <div className="flex-1 min-h-[300px]">
            <CodeEditor />
          </div>
          <div className="min-h-[200px]">
            <PreviewPanel />
          </div>
        </div>

        {/* Right column - Console, Prompts, Testing */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-auto">
          {/* Top section with tabs for Cursor AI Manager and Console */}
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col bg-white rounded-lg shadow min-h-[300px]">
            <TabsList className="w-full justify-start border-b border-neutral-200 rounded-none">
              <TabsTrigger 
                value="aimanager" 
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                AI Manager
              </TabsTrigger>
              <TabsTrigger 
                value="console" 
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Console
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="aimanager" className="flex-1 p-0 mt-0 overflow-auto">
              <AICodeManager />
            </TabsContent>
            
            <TabsContent value="console" className="flex-1 p-0 mt-0 overflow-auto">
              <ConsolePanel />
            </TabsContent>
          </Tabs>
          
          {/* Bottom section with tabs for Prompts, Testing, and Version Control */}
          <div className="bg-white rounded-lg shadow flex-1 flex flex-col min-h-[300px]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="w-full justify-start border-b border-neutral-200 rounded-none">
                <TabsTrigger 
                  value="prompts" 
                  className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Prompts
                </TabsTrigger>
                <TabsTrigger 
                  value="testing" 
                  className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Testing
                </TabsTrigger>
                <TabsTrigger 
                  value="version-control" 
                  className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Version Control
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompts" className="flex-1 p-0 mt-0 overflow-auto">
                <PromptGenerator />
              </TabsContent>
              
              <TabsContent value="testing" className="flex-1 p-0 mt-0 overflow-auto">
                <TestingPanel />
              </TabsContent>
              
              <TabsContent value="version-control" className="flex-1 p-0 mt-0 overflow-auto">
                <VersionControlPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <StatusBar />
      <Toast />
    </div>
  );
}
