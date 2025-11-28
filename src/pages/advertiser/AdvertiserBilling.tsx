import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AdvertiserBilling = () => {
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: advertiser } = await supabase
          .from("advertisers")
          .select("id")
          .eq("owner_profile_id", user.id)
          .single();

        if (advertiser) {
          setBalance(0); // TODO: Fetch from wallets table
        }
      } catch (error) {
        console.error("Error loading balance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Budgets & Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account balance, payment methods, and billing history
        </p>
      </div>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
          </div>
          <CreditCard className="w-12 h-12 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Payment settings coming soon</p>
      </Card>
    </div>
  );
};

export default AdvertiserBilling;
