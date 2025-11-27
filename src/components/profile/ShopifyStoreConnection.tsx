import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, ExternalLink, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const ShopifyStoreConnection = () => {
  const [shopDomain, setShopDomain] = useState("");
  const [storefrontToken, setStorefrontToken] = useState("");
  const queryClient = useQueryClient();

  // Fetch existing connection
  const { data: storeConnection, isLoading } = useQuery({
    queryKey: ['creator-shopify-store'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('creator_shopify_stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Connect store mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate domain format
      const domain = shopDomain.trim();
      if (!domain.includes('myshopify.com') && !domain.includes('.')) {
        throw new Error("Please enter a valid Shopify domain (e.g., mystore.myshopify.com)");
      }

      // Test the connection by making a simple query
      const testQuery = `{ shop { name email } }`;
      const testResponse = await fetch(`https://${domain}/api/2025-07/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken,
        },
        body: JSON.stringify({ query: testQuery }),
      });

      if (!testResponse.ok) {
        throw new Error("Failed to connect to Shopify. Please check your credentials.");
      }

      const testData = await testResponse.json();
      if (testData.errors) {
        throw new Error("Invalid Shopify credentials. Please check your domain and token.");
      }

      const shopInfo = testData.data?.shop;

      // Save to database
      const { error } = await supabase
        .from('creator_shopify_stores')
        .upsert({
          user_id: user.id,
          shop_domain: domain,
          storefront_access_token: storefrontToken,
          store_name: shopInfo?.name || null,
          store_email: shopInfo?.email || null,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shopify store connected successfully!");
      queryClient.invalidateQueries({ queryKey: ['creator-shopify-store'] });
      setShopDomain("");
      setStorefrontToken("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Disconnect store mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('creator_shopify_stores')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shopify store disconnected");
      queryClient.invalidateQueries({ queryKey: ['creator-shopify-store'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (storeConnection) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Connected Store</h3>
              <p className="text-sm text-muted-foreground">{storeConnection.store_name || storeConnection.shop_domain}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Domain:</span>
          <a 
            href={`https://${storeConnection.shop_domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            {storeConnection.shop_domain}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          Your products will be displayed on your My Page. Customers will checkout directly on your Shopify store.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Connect Your Shopify Store</h3>
        <p className="text-sm text-muted-foreground">
          Display and sell your products directly on your My Page. Sales go to your Shopify account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-domain">Shop Domain</Label>
          <Input
            id="shop-domain"
            placeholder="mystore.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter your Shopify store domain (e.g., mystore.myshopify.com)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="storefront-token">Storefront Access Token</Label>
          <Input
            id="storefront-token"
            type="password"
            placeholder="Your Storefront API token"
            value={storefrontToken}
            onChange={(e) => setStorefrontToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Get this from your Shopify Admin → Settings → Apps and sales channels → Develop apps
          </p>
        </div>

        <Button
          onClick={() => connectMutation.mutate()}
          disabled={!shopDomain || !storefrontToken || connectMutation.isPending}
          className="w-full"
        >
          {connectMutation.isPending ? "Connecting..." : "Connect Store"}
        </Button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <p className="text-sm font-medium">Need help?</p>
        <a
          href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          How to create a Storefront Access Token
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </Card>
  );
};
