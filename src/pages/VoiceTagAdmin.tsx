import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Fingerprint, Plus, Calendar, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function VoiceTagAdmin() {
  const [showCreationFlow, setShowCreationFlow] = useState(false);

  // Get current user
  const [user, setUser] = useState<any>(null);
  
  useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    },
  });

  // Check if user is admin
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');

  // Fetch voice fingerprints
  const { data: voiceFingerprints, isLoading: isLoadingFingerprints } = useQuery({
    queryKey: ['voice-fingerprints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_voice_fingerprints')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch blockchain certificates
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['blockchain-certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episode_blockchain_certificates')
        .select('*, episodes(title)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Voice Tag & Certification</h1>
            <p className="text-muted-foreground">
              Blockchain-backed voice authenticity and content verification
            </p>
          </div>
        </div>
        
        {/* Admin Controls */}
        {isAdmin && (
          <div>
            {!showCreationFlow ? (
              <Button 
                onClick={() => setShowCreationFlow(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Certification
              </Button>
            ) : (
              <Button 
                onClick={() => setShowCreationFlow(false)}
                variant="outline"
                size="lg"
              >
                View Dashboard
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Show dashboard for admins by default, creation flow when button clicked */}
      {(isAdmin && !showCreationFlow) ? (
        <>
          {/* Voice Fingerprints Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-6 w-6 text-primary" />
                Voice Fingerprints
              </CardTitle>
              <CardDescription>
                Cryptographically secured voice identity records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFingerprints ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading voice fingerprints...</p>
                </div>
              ) : voiceFingerprints && voiceFingerprints.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {voiceFingerprints.map((fingerprint) => (
                    <Card key={fingerprint.id} className="border-primary/20">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Fingerprint className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <CardTitle className="text-base">
                              Fingerprint #{fingerprint.id.slice(0, 8)}
                            </CardTitle>
                            <VoiceCertifiedBadge size="sm" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-primary" />
                            <span className="font-medium">Blockchain Hash</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono break-all">
                            {fingerprint.fingerprint_hash?.substring(0, 32)}...
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(fingerprint.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-semibold text-primary">
                            {fingerprint.confidence_score}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="py-12 text-center">
                    <Fingerprint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No voice fingerprints yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Voice fingerprints are created automatically when recording in Studio
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Blockchain Certificates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Blockchain Certificates
              </CardTitle>
              <CardDescription>
                Episode certifications with on-chain verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCertificates ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading certificates...</p>
                </div>
              ) : certificates && certificates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="border-primary/20">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <CardTitle className="text-sm line-clamp-2">
                              {cert.episodes?.title || 'Episode'}
                            </CardTitle>
                            <VoiceCertifiedBadge size="sm" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-primary" />
                            <span className="font-medium">Certificate Hash</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono break-all">
                            {cert.certificate_hash.substring(0, 32)}...
                          </div>
                        </div>

                        {cert.voice_fingerprint_id && (
                          <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs">
                              <Fingerprint className="h-3 w-3 text-primary" />
                              <span className="font-medium">Voice Fingerprint</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Verified ✓
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(cert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="py-12 text-center">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No blockchain certificates yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Click "Create Certification" to certify your first episode on blockchain
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Creation Flow - Placeholder for now */}
          <Card>
            <CardHeader>
              <CardTitle>Create Blockchain Certification</CardTitle>
              <CardDescription>
                Certify podcast episodes with blockchain-backed voice verification
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Certificate creation interface coming soon
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
