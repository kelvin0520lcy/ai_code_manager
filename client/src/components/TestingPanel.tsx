import { useContext, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectContext, Test } from "@/contexts/ProjectContext";
import { Play, Plus, RefreshCw, Check, AlertTriangle, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import TestResultsPanel from "./TestResultsPanel";

export default function TestingPanel() {
  const { files, activeFile, tests, runTests, addTest } = useContext(ProjectContext);
  const { toast } = useToast();
  
  const [newTestName, setNewTestName] = useState("");
  const [newTestScript, setNewTestScript] = useState("");
  const [selectedFileId, setSelectedFileId] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  const handleRunTests = async () => {
    setIsRunningTests(true);
    
    try {
      if (activeFile.type !== 'folder') {
        // Pass fileIds as an array of numbers
        await runTests(undefined, [parseInt(activeFile.id)]);
        toast({
          title: "Tests Execution Started",
          description: "Running tests for current file",
          variant: "default",
        });
      } else {
        toast({
          title: "Cannot Run Tests",
          description: "Please select a file to run tests for",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to run tests', error);
      toast({
        title: "Test Execution Failed",
        description: "There was an error running the tests",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const handleRunSingleTest = async (testId: string) => {
    setIsRunningTests(true);
    
    try {
      // Pass the testId as a string (will be parsed in the runTests function)
      await runTests(testId);
      toast({
        title: "Test Started",
        description: "Running selected test",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to run test', error);
      toast({
        title: "Test Execution Failed",
        description: "There was an error running the test",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const handleAddTest = () => {
    if (!newTestName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a test name",
        variant: "destructive",
      });
      return;
    }
    
    if (!newTestScript.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a test script",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFileId) {
      toast({
        title: "Missing Information",
        description: "Please select a file to test",
        variant: "destructive",
      });
      return;
    }
    
    const newTest: Test = {
      id: (Date.now()).toString(),
      name: newTestName,
      script: newTestScript,
      status: 'not_run',
      result: null,
      fileId: selectedFileId
    };
    
    addTest(newTest);
    
    toast({
      title: "Test Added",
      description: `Successfully added test '${newTestName}'`,
      variant: "default",
    });
    
    // Reset form
    setNewTestName("");
    setNewTestScript("");
    setSelectedFileId("");
    setIsAddingTest(false);
  };
  
  const filteredTests = tests.filter(test => 
    activeFile.type !== 'folder' ? test.fileId === activeFile.id : true
  );
  
  const codeFiles = files.filter(file => file.type !== 'folder');
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-muted/40 border-b p-2 flex justify-between items-center">
        <h2 className="font-semibold">Testing</h2>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRunTests}
            disabled={isRunningTests}
          >
            {isRunningTests ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Run Tests
          </Button>
          
          <Dialog open={isAddingTest} onOpenChange={setIsAddingTest}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default">
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Test</DialogTitle>
                <DialogDescription>
                  Create a new test for your code. Tests help verify your code works correctly.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="test-name">Test Name</Label>
                  <Input 
                    id="test-name" 
                    value={newTestName} 
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="e.g., 'Should validate user input'"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-file">File to Test</Label>
                  <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file" />
                    </SelectTrigger>
                    <SelectContent>
                      {codeFiles.map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-script">Test Description</Label>
                  <Textarea
                    id="test-script"
                    value={newTestScript}
                    onChange={(e) => setNewTestScript(e.target.value)}
                    rows={5}
                    placeholder="Describe what your test should verify. For example: 'This test checks if the form validation correctly handles invalid email input and displays appropriate error messages.'"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingTest(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTest}>
                  Add Test
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="results" className="h-full flex flex-col">
          <div className="border-b px-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="tests">Available Tests</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="results" className="h-full m-0">
              <TestResultsPanel />
            </TabsContent>
            
            <TabsContent value="tests" className="h-full m-0 p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {activeFile.type !== 'folder' 
                      ? `Tests for ${activeFile.name}` 
                      : 'All Tests'}
                  </h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'}
                  </span>
                </div>
                
                {filteredTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No tests found for this file.</p>
                    <p className="text-sm">Create a new test to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTests.map(test => (
                      <Card key={test.id} className="overflow-hidden">
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm font-medium flex items-center">
                                {test.status === 'passed' && <Check className="h-4 w-4 text-green-500 mr-1" />}
                                {test.status === 'failed' && <X className="h-4 w-4 text-red-500 mr-1" />}
                                {test.status === 'not_run' && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />}
                                {test.name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {test.status === 'not_run' 
                                  ? 'Test has not been run yet' 
                                  : test.result}
                              </CardDescription>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleRunSingleTest(test.id)}
                              disabled={isRunningTests}
                            >
                              {isRunningTests ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="text-xs py-0 px-4 pb-2 bg-muted/30 border-t">
                          <pre className="whitespace-pre-wrap font-mono">{test.script}</pre>
                        </CardContent>
                        
                        {test.details && (
                          <CardFooter className="py-2 bg-muted/50 text-xs text-muted-foreground flex justify-between">
                            {test.details.coverage !== undefined && (
                              <span>Coverage: {test.details.coverage}%</span>
                            )}
                            {test.details.executionTime !== undefined && (
                              <span>Time: {test.details.executionTime}ms</span>
                            )}
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}