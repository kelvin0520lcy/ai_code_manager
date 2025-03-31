import { useContext } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Code2, Settings, GitBranchPlus, HelpCircle } from 'lucide-react';
import ProjectSelector from './ProjectSelector';

export default function AppHeader() {
  const { user, appVersion } = useContext(ProjectContext);

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b bg-white z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">AI Code Manager</h1>
        </div>
        
        <ProjectSelector />
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">v{appVersion}</span>
        
        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
          <GitBranchPlus className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
          <Settings className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8 border">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {user.initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}