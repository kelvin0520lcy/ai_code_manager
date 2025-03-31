import { useContext, useState, useEffect } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CodeEditor() {
  const { activeFile, updateFileContent } = useContext(ProjectContext);
  const [code, setCode] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.content);
    }
  }, [activeFile]);

  const handleSaveCode = () => {
    if (activeFile) {
      updateFileContent(activeFile.id, code);
      setIsEditing(false);
    }
  };

  return (
    <Card className="w-full flex-1 flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{activeFile ? activeFile.name : 'No file selected'}</span>
            {activeFile && (
              <span className="text-xs text-neutral-500">{activeFile.type}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={handleSaveCode}
              >
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2"
            >
              <Play className="h-4 w-4 mr-1" /> Run
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex">
        {activeFile ? (
          <div className="w-full h-full relative">
            <Textarea
              className="font-mono text-sm p-4 h-full w-full resize-none overflow-auto border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setCode(e.target.value);
                setIsEditing(true);
              }}
              placeholder="// Your code here"
            />
            <div className="absolute top-0 right-0 p-2 text-xs text-neutral-500">
              {activeFile.type}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            Select a file to edit
          </div>
        )}
      </CardContent>
    </Card>
  );
}