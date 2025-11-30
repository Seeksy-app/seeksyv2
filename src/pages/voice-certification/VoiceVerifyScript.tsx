import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VOICE_PROMPTS = [
  "Hi, my name is {name}. I'm recording this sample to verify my voice on Seeksy and protect my identity.",
  "This is {name} confirming that Seeksy can use this recording only to verify my voice and secure my account.",
  "I'm {name}, and I'm recording this voice sample so Seeksy can help keep my identity safe on the platform."
];

const VoiceVerifyScript = () => {
  const navigate = useNavigate();
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [userName, setUserName] = useState<string>("there");

  useEffect(() => {
    fetchUserAndPrompt();
  }, []);

  const fetchUserAndPrompt = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || "there";
    setUserName(name);
    
    const randomPrompt = VOICE_PROMPTS[Math.floor(Math.random() * VOICE_PROMPTS.length)];
    setSelectedPrompt(randomPrompt.replace('{name}', name));
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Identity
        </Button>

        <Card className="p-12">
          <div className="text-center space-y-6">
            <Mic className="h-16 w-16 mx-auto text-primary" />
            
            <div>
              <h1 className="text-3xl font-bold mb-3">Verify Your Voice Identity</h1>
              <p className="text-muted-foreground">
                Read the phrase below out loud.
              </p>
            </div>

            {/* Script Block */}
            <Card className="bg-primary/5 border-primary/20 p-8">
              <p className="text-lg leading-relaxed">
                "{selectedPrompt}"
              </p>
            </Card>

            <Button 
              size="lg" 
              onClick={() => navigate("/identity/voice/record", { state: { selectedPrompt } })}
              className="w-full"
            >
              <Mic className="h-5 w-5 mr-2" />
              Begin Recording
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceVerifyScript;
