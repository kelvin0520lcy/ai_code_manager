import { useContext } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, FolderClosed } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FileExplorer() {
  const { files, activeFile, setActiveFile } = useContext(ProjectContext);

  // Function to group files by their type (folder structure)
  const groupFilesByType = () => {
    // In a real implementation, this would parse file paths and create a tree structure
    // For now, we'll just return files grouped by their type
    const fileTypesSet = new Set<string>();
    files.forEach(file => fileTypesSet.add(file.type));
    const fileTypes = Array.from(fileTypesSet);
    
    return fileTypes.map(type => ({
      type,
      files: files.filter(file => file.type === type)
    }));
  };

  const fileGroups = groupFilesByType();

  return (
    <Card className="w-full flex-1 flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Files
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1">
        <ScrollArea className="h-[calc(100vh-280px)]">
          {fileGroups.map((group) => (
            <div key={group.type} className="mb-3">
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-500 uppercase">
                <FolderClosed className="h-3 w-3" />
                {group.type}
              </div>
              <div className="mt-1">
                {group.files.map((file) => (
                  <Button
                    key={file.id}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-1 h-8 text-sm ${
                      activeFile?.id === file.id ? 'bg-neutral-100' : ''
                    }`}
                    onClick={() => setActiveFile(file)}
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    {file.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}