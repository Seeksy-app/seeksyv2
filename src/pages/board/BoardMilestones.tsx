/**
 * Milestones Tracker - Completed vs upcoming milestones with progress tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Circle, Clock, AlertTriangle, 
  ArrowRight, Calendar, Users, Zap, Target, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming' | 'at-risk' | 'blocked';

interface Milestone {
  id: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  progress: number;
  dueDate: string;
  owner: string;
  dependencies: string[];
  blockers?: string[];
  category: 'product' | 'growth' | 'operations' | 'fundraising';
}

const MILESTONES: Milestone[] = [
  // Completed
  {
    id: 'm1',
    name: 'Platform MVP Launch',
    description: 'Core podcast hosting and creator tools live',
    status: 'completed',
    progress: 100,
    dueDate: '2024-06-01',
    owner: 'Product Team',
    dependencies: [],
    category: 'product',
  },
  {
    id: 'm2',
    name: 'First 100 Creators',
    description: 'Onboard initial creator cohort',
    status: 'completed',
    progress: 100,
    dueDate: '2024-08-01',
    owner: 'Growth Team',
    dependencies: ['m1'],
    category: 'growth',
  },
  {
    id: 'm3',
    name: 'Identity Verification v1',
    description: 'Voice and face verification system live',
    status: 'completed',
    progress: 100,
    dueDate: '2024-10-01',
    owner: 'Engineering',
    dependencies: ['m1'],
    category: 'product',
  },
  
  // In Progress
  {
    id: 'm4',
    name: 'AI Clips Engine',
    description: 'Automated clip generation from long-form content',
    status: 'in-progress',
    progress: 75,
    dueDate: '2025-01-15',
    owner: 'AI Team',
    dependencies: ['m1'],
    category: 'product',
  },
  {
    id: 'm5',
    name: '1,000 Active Creators',
    description: 'Reach critical mass for marketplace',
    status: 'in-progress',
    progress: 60,
    dueDate: '2025-02-01',
    owner: 'Growth Team',
    dependencies: ['m2'],
    category: 'growth',
  },
  {
    id: 'm6',
    name: 'Seed Round Close',
    description: '$1.5M seed funding secured',
    status: 'in-progress',
    progress: 40,
    dueDate: '2025-03-01',
    owner: 'CEO',
    dependencies: [],
    category: 'fundraising',
  },
  
  // At Risk
  {
    id: 'm7',
    name: 'Advertising Marketplace v1',
    description: 'Self-serve ad buying for brands',
    status: 'at-risk',
    progress: 30,
    dueDate: '2025-02-15',
    owner: 'Product Team',
    dependencies: ['m4', 'm5'],
    blockers: ['Engineering capacity constraint'],
    category: 'product',
  },
  
  // Upcoming
  {
    id: 'm8',
    name: 'Mobile App Launch',
    description: 'iOS and Android creator apps',
    status: 'upcoming',
    progress: 0,
    dueDate: '2025-04-01',
    owner: 'Mobile Team',
    dependencies: ['m4'],
    category: 'product',
  },
  {
    id: 'm9',
    name: 'Enterprise Tier Launch',
    description: 'White-label solution for agencies',
    status: 'upcoming',
    progress: 0,
    dueDate: '2025-05-01',
    owner: 'Product Team',
    dependencies: ['m5'],
    category: 'product',
  },
  {
    id: 'm10',
    name: '10,000 Creators',
    description: 'Scale to market leadership position',
    status: 'upcoming',
    progress: 0,
    dueDate: '2025-12-01',
    owner: 'Growth Team',
    dependencies: ['m5', 'm7'],
    category: 'growth',
  },
];

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  'in-progress': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  upcoming: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border' },
  'at-risk': { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  blocked: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const CATEGORY_ICONS = {
  product: Zap,
  growth: Users,
  operations: Target,
  fundraising: Calendar,
};

export default function BoardMilestones() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MilestoneStatus | 'all'>('all');
  
  const filteredMilestones = filter === 'all' 
    ? MILESTONES 
    : MILESTONES.filter(m => m.status === filter);
  
  const stats = {
    total: MILESTONES.length,
    completed: MILESTONES.filter(m => m.status === 'completed').length,
    inProgress: MILESTONES.filter(m => m.status === 'in-progress').length,
    atRisk: MILESTONES.filter(m => m.status === 'at-risk' || m.status === 'blocked').length,
    upcoming: MILESTONES.filter(m => m.status === 'upcoming').length,
  };
  
  const overallProgress = Math.round(
    MILESTONES.reduce((sum, m) => sum + m.progress, 0) / MILESTONES.length
  );
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Milestones Tracker</h1>
        <p className="text-muted-foreground">Track progress on key company milestones</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">
                {stats.completed} of {stats.total} milestones complete
              </p>
            </div>
            <span className="text-3xl font-bold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setFilter('completed')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setFilter('in-progress')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilter('at-risk')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.atRisk}</p>
                <p className="text-sm text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-border transition-colors" onClick={() => setFilter('upcoming')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'completed', 'in-progress', 'at-risk', 'upcoming'] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : status.replace('-', ' ')}
          </Button>
        ))}
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.map(milestone => {
          const config = STATUS_CONFIG[milestone.status];
          const StatusIcon = config.icon;
          const CategoryIcon = CATEGORY_ICONS[milestone.category];
          
          return (
            <Card key={milestone.id} className={cn("border", config.border)}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", config.bg)}>
                    <StatusIcon className={cn("w-5 h-5", config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{milestone.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {milestone.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                    
                    {/* Progress bar for in-progress items */}
                    {milestone.status === 'in-progress' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>
                    )}
                    
                    {/* Blockers */}
                    {milestone.blockers && milestone.blockers.length > 0 && (
                      <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Blockers:
                        </p>
                        <ul className="text-xs text-red-500/80 mt-1">
                          {milestone.blockers.map((blocker, i) => (
                            <li key={i}>• {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {milestone.owner}
                      </span>
                      {milestone.dependencies.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {milestone.dependencies.length} dependencies
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={
                      milestone.status === 'completed' ? 'default' :
                      milestone.status === 'in-progress' ? 'secondary' :
                      milestone.status === 'at-risk' ? 'destructive' : 'outline'
                    }>
                      {milestone.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
