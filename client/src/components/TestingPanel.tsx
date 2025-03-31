import { useContext, useState } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Plus, Check, AlertTriangle } from 'lucide-react';

export default function TestingPanel() {
  const { tests, runTests, addTest, activeFile } = useContext(ProjectContext);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [testName, setTestName] = useState('');
  const [testScript, setTestScript] = useState('');

  const handleRunAllTests = () => {
    runTests();
  };

  const handleRunTest = (testId: string) => {
    runTests(testId);
  };

  const handleCreateTest = () => {
    if (testName.trim() && testScript.trim()) {
      addTest({
        id: Date.now().toString(), // Temporary ID
        name: testName,
        script: testScript,
        status: 'not_run',
        result: null
      });
      setTestName('');
      setTestScript('');
      setIsCreatingTest(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'running':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Tests</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCreatingTest(true)}
          >
            <Plus className="h-3 w-3 mr-1" /> New Test
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handleRunAllTests}
          >
            <PlayCircle className="h-3 w-3 mr-1" /> Run All
          </Button>
        </div>
      </div>

      {isCreatingTest ? (
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Test Name</label>
                <input 
                  type="text" 
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full text-sm px-3 py-1 border rounded"
                  placeholder="e.g., Validate User Input"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Test Script</label>
                <textarea 
                  value={testScript}
                  onChange={(e) => setTestScript(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded font-mono min-h-[100px]"
                  placeholder="// Write your test code here"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsCreatingTest(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleCreateTest}
                  disabled={!testName.trim() || !testScript.trim()}
                >
                  Create Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
          No tests available for this project
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {tests.map((test) => (
              <Card key={test.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b bg-neutral-50">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-sm">{test.name}</span>
                    <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                      {test.status === 'not_run' ? 'Not Run' : test.status}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRunTest(test.id)}
                    disabled={test.status === 'running'}
                  >
                    <PlayCircle className="h-3 w-3 mr-1" /> Run
                  </Button>
                </div>
                {test.result && (
                  <div className="p-3 text-xs font-mono overflow-x-auto">
                    {test.result}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}