import { useContext } from 'react';
import { ProjectContext } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ConsolePanel() {
  const { logs, clearLogs } = useContext(ProjectContext);

  // Function to format log messages with timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  // Function to determine text color based on log type
  const getLogTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>Console</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearLogs}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-52">
          <div className="p-2 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-neutral-500 p-2">No logs to display</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="py-1 border-b border-neutral-100 last:border-0">
                  <span className="text-neutral-500 mr-2">[{formatTime(log.timestamp)}]</span>
                  <span className={`font-medium ${getLogTypeColor(log.type)} mr-2`}>
                    {log.type.toUpperCase()}:
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}