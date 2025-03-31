import { useContext } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2 } from 'lucide-react';

export default function PreviewPanel() {
  const { activeFile } = useContext(ProjectContext);

  return (
    <Card className="w-full h-64">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Preview</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100%-48px)] overflow-auto">
        {activeFile ? (
          <div className="text-sm">
            {activeFile.type.includes('javascript') || activeFile.type.includes('typescript') ? (
              <div className="font-mono p-2 bg-neutral-50 rounded border border-neutral-200">
                <p>JavaScript/TypeScript execution results would appear here.</p>
              </div>
            ) : activeFile.type.includes('html') ? (
              <div className="border border-neutral-200 rounded p-2 h-full">
                <iframe
                  title="HTML Preview"
                  srcDoc={activeFile.content}
                  className="w-full h-full"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="text-neutral-500 flex items-center justify-center h-full">
                No preview available for this file type
              </div>
            )}
          </div>
        ) : (
          <div className="text-neutral-500 flex items-center justify-center h-full">
            Select a file to preview
          </div>
        )}
      </CardContent>
    </Card>
  );
}