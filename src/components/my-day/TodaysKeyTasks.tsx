import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function TodaysKeyTasks() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["todays-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = format(new Date(), "yyyy-MM-dd");

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("due_date", today)
        .in("status", ["todo", "in_progress"])
        .order("priority", { ascending: true })
        .limit(5);

      return data || [];
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

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
          {isLoading ? (
            <div className="flex items-center gap-3 p-2">
              <Circle className="h-4 w-4 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <Circle className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">No tasks scheduled for today</p>
                <p className="text-xs text-muted-foreground">Add a task with today's due date</p>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <Circle className={`h-4 w-4 mt-1 ${getPriorityColor(task.priority)}`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.status === "in_progress" ? "In Progress" : "To Do"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/tasks">View All Tasks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
