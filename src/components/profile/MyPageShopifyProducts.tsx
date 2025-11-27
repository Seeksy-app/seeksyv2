import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingCart } from "lucide-react";

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  availableForSale: boolean;
}

export const MyPageShopifyProducts = ({ username }: { username: string }) => {
  // Fetch creator's Shopify connection and products
  const { data: products, isLoading } = useQuery({
    queryKey: ['creator-shopify-products', username],
    queryFn: async () => {
      // Get creator's profile to find user_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (!profile) return [];

      // Get their Shopify store connection
      const { data: store } = await supabase
        .from('creator_shopify_stores')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!store) return [];

      // Fetch products from their Shopify store
      const query = `
        query GetProducts {
          products(first: 12) {
            edges {
              node {
                id
                title
                description
                handle
                availableForSale
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(
        `https://${store.shop_domain}/api/2025-07/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': store.storefront_access_token,
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const productEdges = data.data?.products?.edges || [];
      
      return {
        products: productEdges.map((edge: any) => edge.node),
        shopDomain: store.shop_domain,
      };
    },
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading products...
      </div>
    );
  }

  if (!products || Array.isArray(products) || products.products.length === 0) {
    return null;
  }

  const handleProductClick = (handle: string) => {
    window.open(`https://${products.shopDomain}/products/${handle}`, '_blank');
  };

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shop</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://${products.shopDomain}`, '_blank')}
        >
          View Full Store
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.products.map((product: ShopifyProduct) => {
          const image = product.images.edges[0]?.node;
          const price = parseFloat(product.priceRange.minVariantPrice.amount);

          return (
            <Card
              key={product.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProductClick(product.handle)}
            >
              {image && (
                <div className="aspect-square bg-secondary/20 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.altText || product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}
              
              <div className="p-4 space-y-3">
                <h3 className="font-semibold line-clamp-2">{product.title}</h3>
                
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold">
                    {product.priceRange.minVariantPrice.currencyCode} {price.toFixed(2)}
                  </span>
                  
                  <Button size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
