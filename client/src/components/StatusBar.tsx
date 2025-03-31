import { useContext } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { GitBranch, GitCommit, AlertCircle } from 'lucide-react';

export default function StatusBar() {
  const { gitStatus, currentBranch, issues, cursorStatus } = useContext(ProjectContext);

  // Count of total changed files
  const changedFilesCount = 
    gitStatus.modified.length + 
    gitStatus.staged.length + 
    gitStatus.untracked.length;

  return (
    <div className="w-full h-6 bg-neutral-100 border-t text-xs flex items-center px-3 text-neutral-600">
      <div className="flex items-center mr-4">
        <GitBranch className="h-3 w-3 mr-1" />
        {currentBranch}
      </div>
      
      <div className="flex items-center mr-4">
        <GitCommit className="h-3 w-3 mr-1" />
        {changedFilesCount} {changedFilesCount === 1 ? 'change' : 'changes'}
      </div>
      
      <div className="flex items-center mr-4">
        <AlertCircle className="h-3 w-3 mr-1" />
        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
      </div>
      
      <div className="ml-auto flex items-center">
        <span className={`h-2 w-2 rounded-full mr-1 ${
          cursorStatus === 'processing' 
            ? 'bg-amber-500 animate-pulse' 
            : 'bg-green-500'
        }`}></span>
        {cursorStatus === 'processing' ? 'Cursor AI processing...' : 'Cursor AI ready'}
      </div>
    </div>
  );
}