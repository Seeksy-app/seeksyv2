/**
 * Permission Enforcement Test Component
 * 
 * Used by admins to verify RBAC is working correctly across the platform.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { usePermissions, Permission, PermissionCategory } from '@/hooks/usePermissions';

// Define permission categories for testing display
const PERMISSION_CATEGORIES: Record<PermissionCategory, Permission[]> = {
  core: ['core.read', 'core.write'],
  studio: ['studio.access', 'studio.record', 'studio.settings'],
  clips: ['clips.view', 'clips.edit', 'clips.delete'],
  media: ['media.view', 'media.upload', 'media.delete'],
  meetings: ['meetings.view', 'meetings.manage', 'meetings.settings'],
  creatorhub: ['creatorhub.view', 'creatorhub.manage'],
  ads: ['ads.view', 'ads.manage', 'ads.billing', 'ads.analytics'],
  supportdesk: ['supportdesk.view', 'supportdesk.reply', 'supportdesk.manage', 'supportdesk.settings'],
  settings: ['settings.view', 'settings.manage'],
  billing: ['billing.view', 'billing.manage'],
  rnd: ['rnd.read', 'rnd.write'],
  admin: ['admin.users', 'admin.roles', 'admin.all', 'admin.impersonate'],
  board: ['board.view', 'board.analytics'],
  events: ['events.view', 'events.manage'],
  crm: ['crm.view', 'crm.manage'],
  marketing: ['marketing.view', 'marketing.manage'],
  podcasts: ['podcasts.view', 'podcasts.manage', 'podcasts.publish'],
  monetization: ['monetization.view', 'monetization.manage'],
  identity: ['identity.view', 'identity.manage', 'identity.certify'],
};
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';

interface TestResult {
  name: string;
  passed: boolean;
  description: string;
}

export function PermissionEnforcementTest() {
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { permissions, hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const { navigation, canAccessPath, isLoading: navLoading } = useRoleBasedNavigation();

  const isLoading = rolesLoading || permissionsLoading || navLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permission Enforcement Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading permissions...</p>
        </CardContent>
      </Card>
    );
  }

  // Run permission tests
  const tests: TestResult[] = [
    {
      name: 'Roles Loaded',
      passed: roles.length > 0,
      description: `User has ${roles.length} role(s): ${roles.join(', ') || 'none'}`
    },
    {
      name: 'Permissions Loaded',
      passed: permissions.length > 0,
      description: `User has ${permissions.length} permission(s)`
    },
    {
      name: 'Admin Navigation Access',
      passed: isAdmin ? navigation.length > 0 : navigation.length === 0,
      description: isAdmin 
        ? `Admin user can see ${navigation.length} navigation groups`
        : 'Non-admin correctly sees no admin navigation'
    },
    {
      name: 'Help Desk Path Check',
      passed: canAccessPath('/helpdesk') === hasAnyPermission(['supportdesk.view', 'supportdesk.reply', 'supportdesk.manage']),
      description: 'Help Desk access matches support desk permissions'
    },
    {
      name: 'R&D Path Check',
      passed: canAccessPath('/admin/rd-feeds') === hasAnyPermission(['rnd.read', 'rnd.write']),
      description: 'R&D feeds access matches R&D permissions'
    },
    {
      name: 'Admin Path Check',
      passed: canAccessPath('/admin') === hasPermission('admin.users'),
      description: 'Admin path access matches admin.users permission'
    }
  ];

  const passedTests = tests.filter(t => t.passed).length;
  const allPassed = passedTests === tests.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Permission Enforcement Test
          {allPassed ? (
            <Badge variant="default" className="ml-auto bg-emerald-500">All Passed</Badge>
          ) : (
            <Badge variant="destructive" className="ml-auto">{passedTests}/{tests.length} Passed</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Verify RBAC is working correctly for the current user
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="p-3 rounded-lg bg-muted">
          <div className="text-sm font-medium mb-2">Current User</div>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <Badge key={role} variant="outline">{role}</Badge>
            ))}
            {isAdmin && <Badge className="bg-amber-500">Admin</Badge>}
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          {tests.map((test, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
              {test.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
              )}
              <div>
                <div className="font-medium text-sm">{test.name}</div>
                <div className="text-xs text-muted-foreground">{test.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Permission Categories */}
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Permission Categories</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.keys(PERMISSION_CATEGORIES).map(category => {
              const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
              const hasAny = categoryPermissions.some(p => permissions.includes(p));
              return (
                <div 
                  key={category} 
                  className={`p-2 rounded border text-xs ${hasAny ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950' : 'bg-muted'}`}
                >
                  <div className="flex items-center gap-1">
                    {hasAny ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="font-medium capitalize">{category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Groups */}
        {navigation.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Accessible Navigation</div>
            <div className="space-y-1">
              {navigation.map(group => (
                <div key={group.group} className="text-xs">
                  <span className="font-medium">{group.group}:</span>{' '}
                  <span className="text-muted-foreground">
                    {group.items.map(i => i.label).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
