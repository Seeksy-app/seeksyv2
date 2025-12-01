import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function TodaysKeyTasks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Today's Key Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <Circle className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">No tasks scheduled for today</p>
              <p className="text-xs text-muted-foreground">Add a task to get started</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/tasks">View All Tasks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
