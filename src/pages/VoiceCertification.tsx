import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Radio, FileAudio, Fingerprint, Lock, Award, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VoiceCertification = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
              <Shield className="h-3 w-3 mr-1" />
              Voice Authentication Technology
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Certified Voice
              </span>
              <br />
              <span className="text-foreground">Authenticity</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Protect your voice, verify your content, and build trust with blockchain-backed voice certification for podcasts, livestreams, and social media.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")}
                className="text-lg px-8 py-6 h-auto"
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="text-lg px-8 py-6 h-auto"
              >
                View Pricing
              </Button>
            </div>
          </div>

          {/* Certification Badges Display */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                  <Shield className="h-4 w-4" />
                  Certified Voice
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Appears on all certified content
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                  <Fingerprint className="h-8 w-8 text-accent" />
                </div>
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                  <Lock className="h-4 w-4" />
                  Voice Verified
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Blockchain-backed authenticity
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-gold/20 bg-card/50 backdrop-blur-sm hover:border-brand-gold/40 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-gold/10 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-brand-gold" />
                </div>
                <div className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full text-sm font-semibold">
                  <Radio className="h-4 w-4" />
                  Live Authenticated
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Real-time voice authentication
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                How Voice Certification Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Seamless voice authentication across all your content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Radio className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">1. Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Start your podcast, livestream, or social post in Seeksy Studio
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">2. Capture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    AI automatically captures your unique voice fingerprint during recording
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">3. Certify</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Voice signature is encrypted and stored on blockchain with certificate hash
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">4. Verify</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Content displays "Certified Voice" badge with verifiable proof of authenticity
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Why Voice Certification Matters
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Combat deepfakes and protect your brand in the age of AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Combat Deepfakes</CardTitle>
                      <p className="text-muted-foreground">
                        With AI voice cloning on the rise, voice certification provides cryptographic proof that content is genuinely yours. By 2026, over 90% of online content may be AI-generated—stand out with verified authenticity.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Protect Your Rights</CardTitle>
                      <p className="text-muted-foreground">
                        Establish clear ownership and licensing terms for your voice. Advertisers can verify authenticity and creators maintain control over how their voice is used across platforms.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Build Trust</CardTitle>
                      <p className="text-muted-foreground">
                        Display verification badges on your podcasts, livestreams, and social content. Give your audience confidence that they're hearing the real you, not an AI clone.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileAudio className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Cross-Platform</CardTitle>
                      <p className="text-muted-foreground">
                        Your voice certification travels with your content everywhere. Works with podcasts, YouTube, Spotify, social clips, and any platform where your voice appears.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Built on Industry Standards
              </h2>
              <p className="text-xl text-muted-foreground">
                Compatible with C2PA and leading content authenticity frameworks
              </p>
            </div>

            <Card className="bg-card border-2">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Voice Fingerprinting</h3>
                      <p className="text-muted-foreground">
                        Captures unique audio characteristics including spectral centroid, zero-crossing rate, MFCC coefficients, and frequency distribution patterns to create your voice signature.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Blockchain Certification</h3>
                      <p className="text-muted-foreground">
                        Voice fingerprints are hashed using SHA-256 and stored on Polygon blockchain, creating tamper-proof proof of ownership with permanent public verification.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <FileAudio className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Content Credentials</h3>
                      <p className="text-muted-foreground">
                        Aligned with C2PA (Coalition for Content Provenance and Authenticity) standards used by BBC, Adobe, OpenAI, Google, and Microsoft for content authenticity.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
                      <p className="text-muted-foreground">
                        Voice signatures are encrypted and only hash values are public. Your actual voice data stays private while maintaining verifiable authenticity.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Ready to Certify Your Voice?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join creators who are protecting their voice and building trust with verified content
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth?mode=signup")}
                  className="text-lg px-8 py-6 h-auto"
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/personas")}
                  className="text-lg px-8 py-6 h-auto"
                >
                  <FileAudio className="mr-2 h-5 w-5" />
                  Meet Our AI Personas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default VoiceCertification;
