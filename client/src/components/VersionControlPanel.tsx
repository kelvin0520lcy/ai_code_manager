import { useContext, useState } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GitCommit, GitBranch, GitMerge, RotateCcw, Check } from 'lucide-react';

export default function VersionControlPanel() {
  const { gitStatus, commitChanges, rollbackChanges, branches, currentBranch, switchBranch } = useContext(ProjectContext);
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState('changes');

  const handleCommit = () => {
    if (commitMessage.trim()) {
      commitChanges(commitMessage);
      setCommitMessage('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            <span>Version Control</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            {currentBranch}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 h-10 rounded-none">
            <TabsTrigger value="changes" className="data-[state=active]:shadow-none">Changes</TabsTrigger>
            <TabsTrigger value="branches" className="data-[state=active]:shadow-none">Branches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="changes" className="m-0">
            <div className="p-3">
              <div className="mb-3">
                <textarea 
                  placeholder="Commit message..." 
                  className="w-full p-2 text-sm border rounded min-h-[60px] mb-2"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                />
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={rollbackChanges}
                    className="text-xs"
                    disabled={
                      gitStatus.modified.length === 0 && 
                      gitStatus.staged.length === 0 && 
                      gitStatus.untracked.length === 0
                    }
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Discard
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleCommit}
                    className="text-xs"
                    disabled={
                      !commitMessage.trim() || 
                      (gitStatus.modified.length === 0 && 
                      gitStatus.staged.length === 0 && 
                      gitStatus.untracked.length === 0)
                    }
                  >
                    <Check className="h-3 w-3 mr-1" /> Commit
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[200px]">
                {gitStatus.modified.length === 0 && 
                 gitStatus.staged.length === 0 && 
                 gitStatus.untracked.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500 text-sm">
                    No changes to commit
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gitStatus.staged.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-green-600 mb-1">Staged Changes</h4>
                        <ul className="space-y-1">
                          {gitStatus.staged.map((file, index) => (
                            <li key={index} className="flex items-center text-xs py-1 px-2 bg-green-50 rounded">
                              <span className="truncate">{file}</span>
                              <Badge className="ml-auto bg-green-100 text-green-800 text-[10px]">staged</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {gitStatus.modified.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-amber-600 mb-1">Modified</h4>
                        <ul className="space-y-1">
                          {gitStatus.modified.map((file, index) => (
                            <li key={index} className="flex items-center text-xs py-1 px-2 bg-amber-50 rounded">
                              <span className="truncate">{file}</span>
                              <Badge className="ml-auto bg-amber-100 text-amber-800 text-[10px]">modified</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {gitStatus.untracked.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-blue-600 mb-1">Untracked</h4>
                        <ul className="space-y-1">
                          {gitStatus.untracked.map((file, index) => (
                            <li key={index} className="flex items-center text-xs py-1 px-2 bg-blue-50 rounded">
                              <span className="truncate">{file}</span>
                              <Badge className="ml-auto bg-blue-100 text-blue-800 text-[10px]">new</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="branches" className="m-0">
            <div className="p-3">
              <Button variant="outline" size="sm" className="mb-3 text-xs w-full">
                <GitBranch className="h-3 w-3 mr-1" /> Create New Branch
              </Button>
              
              <ScrollArea className="h-[230px]">
                <div className="space-y-1">
                  {branches.map((branch) => (
                    <Button
                      key={branch}
                      variant="ghost"
                      className={`w-full justify-start text-xs h-8 ${
                        branch === currentBranch ? 'bg-neutral-100' : ''
                      }`}
                      onClick={() => switchBranch(branch)}
                    >
                      {branch === currentBranch ? (
                        <GitBranch className="h-3 w-3 mr-2 text-primary" />
                      ) : (
                        <GitBranch className="h-3 w-3 mr-2 text-neutral-500" />
                      )}
                      {branch}
                      {branch === currentBranch && (
                        <Badge className="ml-auto text-[10px] bg-primary">current</Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}