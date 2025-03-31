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

export default function Home() {
  const [activeTab, setActiveTab] = useState("prompts");

  return (
    <div className="flex flex-col h-screen bg-neutral-50 font-sans text-neutral-900 overflow-hidden">
      <AppHeader />
      
      <div className="flex-1 p-4 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left column - Files */}
        <div className="w-full lg:w-64 flex flex-col gap-4 h-full overflow-hidden">
          <FileExplorer />
        </div>

        {/* Center column - Code Editor and Preview */}
        <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-1">
            <CodeEditor />
          </div>
          <PreviewPanel />
        </div>

        {/* Right column - Console, Prompts, Testing */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full overflow-hidden">
          <ConsolePanel />
          
          <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
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
              
              <TabsContent value="prompts" className="flex-1 p-0 mt-0 overflow-hidden">
                <PromptGenerator />
              </TabsContent>
              
              <TabsContent value="testing" className="flex-1 p-0 mt-0 overflow-hidden">
                <TestingPanel />
              </TabsContent>
              
              <TabsContent value="version-control" className="flex-1 p-0 mt-0 overflow-hidden">
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
