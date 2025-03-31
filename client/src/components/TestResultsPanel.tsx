import { useContext } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectContext } from "@/contexts/ProjectContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle, Clock, FileCode } from "lucide-react";

interface TestAssertionProps {
  name: string;
  status: 'passed' | 'failed';
}

const TestAssertion = ({ name, status }: TestAssertionProps) => {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center">
        {status === 'passed' ? 
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : 
          <XCircle className="mr-2 h-4 w-4 text-red-500" />
        }
        <span className="text-sm">{name}</span>
      </div>
      <Badge variant={status === 'passed' ? "default" : "destructive"}>
        {status === 'passed' ? "Passed" : "Failed"}
      </Badge>
    </div>
  );
};

interface TestDetailProps {
  test: any;
}

const TestDetail = ({ test }: TestDetailProps) => {
  const details = test.details || {};
  const assertions = details.assertions || [];
  
  return (
    <Card className={`mb-4 border-l-4 ${test.status === 'passed' ? 'border-l-green-500' : test.status === 'failed' ? 'border-l-red-500' : 'border-l-yellow-300'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            {test.status === 'passed' ? 
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> : 
              test.status === 'failed' ? 
                <XCircle className="mr-2 h-5 w-5 text-red-500" /> : 
                <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
            }
            {test.name}
          </CardTitle>
          <Badge variant={test.status === 'passed' ? "default" : test.status === 'failed' ? "destructive" : "outline"}>
            {test.status === 'passed' ? "Passed" : test.status === 'failed' ? "Failed" : "Not Run"}
          </Badge>
        </div>
        <CardDescription>{test.result || 'Test has not been run yet'}</CardDescription>
      </CardHeader>
      
      {details.coverage !== undefined && (
        <CardContent className="pb-2 pt-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm mb-1">
              <span>Coverage:</span>
              <span className="font-medium">{details.coverage}%</span>
            </div>
            <Progress value={details.coverage} className="h-2" />
            
            {details.executionTime !== undefined && (
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Clock className="mr-1 h-4 w-4" />
                <span>Execution time: {details.executionTime}ms</span>
              </div>
            )}
          </div>
          
          {assertions.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium mb-2">Assertions</h4>
                {assertions.map((assertion: TestAssertionProps, index: number) => (
                  <TestAssertion key={index} name={assertion.name} status={assertion.status} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
      
      <CardFooter className="pt-2 text-xs text-muted-foreground flex items-center">
        <FileCode className="mr-1 h-3 w-3" />
        <span>Test ID: {test.id}</span>
      </CardFooter>
    </Card>
  );
};

export default function TestResultsPanel() {
  const { tests } = useContext(ProjectContext);
  
  const passedTests = tests.filter(test => test.status === 'passed');
  const failedTests = tests.filter(test => test.status === 'failed');
  const notRunTests = tests.filter(test => test.status === 'not_run');
  
  // Calculate overall test coverage
  const overallCoverage = tests.length > 0 
    ? Math.round(tests.reduce((sum, test) => sum + ((test.details?.coverage || 0) / tests.length), 0))
    : 0;
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Test Results</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-green-50">
            {passedTests.length} Passed
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            {failedTests.length} Failed
          </Badge>
          <Badge variant="outline">
            {notRunTests.length} Not Run
          </Badge>
        </div>
      </div>
      
      {tests.length > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-medium">Overall Coverage:</span>
            <span className="font-medium">{overallCoverage}%</span>
          </div>
          <Progress value={overallCoverage} className="h-2" />
        </div>
      )}
      
      <div className="overflow-y-auto flex-1">
        {failedTests.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-red-500 flex items-center">
              <XCircle className="mr-1 h-4 w-4" /> Failed Tests
            </h3>
            {failedTests.map(test => (
              <TestDetail key={test.id} test={test} />
            ))}
          </div>
        )}
        
        {passedTests.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-green-500 flex items-center">
              <CheckCircle className="mr-1 h-4 w-4" /> Passed Tests
            </h3>
            {passedTests.map(test => (
              <TestDetail key={test.id} test={test} />
            ))}
          </div>
        )}
        
        {notRunTests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-500 flex items-center">
              <AlertCircle className="mr-1 h-4 w-4" /> Not Run Tests
            </h3>
            {notRunTests.map(test => (
              <TestDetail key={test.id} test={test} />
            ))}
          </div>
        )}
        
        {tests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No tests available. Create tests to see results here.</p>
          </div>
        )}
      </div>
    </div>
  );
}