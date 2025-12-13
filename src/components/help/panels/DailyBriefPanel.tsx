/**
 * Portal-scoped Daily Brief Panel
 * Shows daily brief content specific to the current portal
 * Powered by Firecrawl for live competitive intelligence
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw, Calendar, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { PortalType, PORTAL_LABELS } from '@/hooks/useHelpDrawer';
import { useNavigate } from 'react-router-dom';
import { useHelpDrawerStore } from '@/hooks/useHelpDrawer';
import { useDailyBrief, useRefreshDailyBrief } from '@/hooks/useDailyBrief';

interface DailyBriefPanelProps {
  portal: PortalType;
  contentKey: string;
}

export function DailyBriefPanel({ portal, contentKey }: DailyBriefPanelProps) {
  const navigate = useNavigate();
  const { close } = useHelpDrawerStore();
  const { data: brief, isLoading } = useDailyBrief(portal);
  const refreshBrief = useRefreshDailyBrief();
  
  const handleRefresh = () => {
    refreshBrief.mutate(portal);
  };
  
  const handleViewFullBrief = () => {
    close();
    const route = portal === 'admin' ? '/admin/daily-brief' : '/creator/daily-brief';
    navigate(route);
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Today's brief for {PORTAL_LABELS[portal]}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshBrief.isPending}>
            {refreshBrief.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewFullBrief}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Full Brief
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {brief?.sections.map(section => (
          <Card key={section.id}>
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2">
                {getIcon(section.type)}
                <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <CardDescription className="text-sm">
                {section.content}
              </CardDescription>
              {section.source && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Source: {section.source}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
