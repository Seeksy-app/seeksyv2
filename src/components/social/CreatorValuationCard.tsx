import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, RefreshCw, TrendingUp, Heart, MessageCircle, Users } from "lucide-react";
import { useCreatorValuation, useCalculateValuation } from "@/hooks/useCreatorValuation";
import { formatDistanceToNow } from "date-fns";

interface CreatorValuationCardProps {
  profileId: string;
}

export function CreatorValuationCard({ profileId }: CreatorValuationCardProps) {
  const { data: valuation, isLoading } = useCreatorValuation(profileId);
  const { calculateValuation, isCalculating } = useCalculateValuation();

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Your Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!valuation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Know Your Worth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Calculate your estimated rates for sponsored content based on your engagement and reach.
          </p>
          <Button 
            onClick={() => calculateValuation(profileId)}
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Calculate My Value
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <DollarSign className="h-5 w-5 text-green-500" />
            Your Worth
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => calculateValuation(profileId)}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Recalculate
              </>
            )}
          </Button>
        </div>
        {valuation.calculated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(valuation.calculated_at), { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Reel</p>
            <p className="text-lg font-bold">{formatPrice(valuation.reel_price_mid)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatPrice(valuation.reel_price_low)} - {formatPrice(valuation.reel_price_high)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Feed Post</p>
            <p className="text-lg font-bold">{formatPrice(valuation.feed_post_price_mid)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatPrice(valuation.feed_post_price_low)} - {formatPrice(valuation.feed_post_price_high)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Story</p>
            <p className="text-lg font-bold">{formatPrice(valuation.story_price_mid)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatPrice(valuation.story_price_low)} - {formatPrice(valuation.story_price_high)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">Followers</span>
            </div>
            <p className="font-semibold">{formatNumber(valuation.followers)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Engagement</span>
            </div>
            <p className="font-semibold">{valuation.engagement_rate.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Heart className="h-3 w-3" />
              <span className="text-xs">Avg Likes</span>
            </div>
            <p className="font-semibold">{formatNumber(valuation.avg_likes_per_post)}</p>
          </div>
        </div>

        {/* Niche Tags */}
        {valuation.assumptions_json?.niche_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {valuation.assumptions_json.niche_tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {valuation.assumptions_json.niche_multiplier > 1 && (
              <Badge variant="outline" className="text-xs text-green-600">
                {valuation.assumptions_json.niche_multiplier}x niche boost
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
