import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
  details?: any;
}

interface IdentityActivityLogProps {
  logs: ActivityLog[];
  onViewFullLog?: () => void;
}

export const IdentityActivityLog = ({ logs, onViewFullLog }: IdentityActivityLogProps) => {
  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold text-center">Identity Activity & Access Log</h3>
        
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm pb-3 border-b last:border-0">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{formatAction(log.action)}</p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground">
                      {log.details.type && `${formatAction(log.details.type)} • `}
                      {log.details.chain && `${log.details.chain} • `}
                      {log.details.token_id && `Token ${log.details.token_id}`}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        )}

        {onViewFullLog && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewFullLog}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View full log
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
