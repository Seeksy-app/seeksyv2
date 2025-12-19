import { useMemo, useCallback } from 'react';
import { RANK_TO_POINTS, WIPNeed, WIPValue, WIPRound, WIPScoreResult } from '@/types/wip';

interface RoundResponse {
  roundIndex: number;
  rankedNeedIds: string[];
}

interface NeedAppearanceMap {
  [needId: string]: number; // count of appearances
}

/**
 * WIP Scoring Engine Hook
 * Implements O*NET-aligned scoring: rank→points, need raw scores, value scores, normalization
 */
export function useWIPScoring(
  needs: WIPNeed[],
  values: WIPValue[],
  rounds: WIPRound[]
) {
  // Build need appearance map from rounds configuration
  const needAppearanceMap = useMemo<NeedAppearanceMap>(() => {
    const map: NeedAppearanceMap = {};
    rounds.forEach((round) => {
      if (round.is_active) {
        round.need_ids.forEach((needId) => {
          map[needId] = (map[needId] || 0) + 1;
        });
      }
    });
    return map;
  }, [rounds]);

  // Compute min/max possible raw scores per need based on appearances
  // With -4 to +4 scale: min = -4 * appearances, max = +4 * appearances
  const getNeedMinMax = useCallback(
    (needId: string): { min: number; max: number } => {
      const appearances = needAppearanceMap[needId] || 0;
      return {
        min: appearances * RANK_TO_POINTS[5], // -4 per appearance
        max: appearances * RANK_TO_POINTS[1], // +4 per appearance
      };
    },
    [needAppearanceMap]
  );

  // Normalize score to 0-100 scale for progress bars
  const normalizeScore = useCallback(
    (rawScore: number, min: number, max: number): number => {
      if (max === min) return 50;
      return ((rawScore - min) / (max - min)) * 100;
    },
    []
  );

  // Calculate mean score (-4 to +4 range) for display
  const calculateMeanScore = useCallback(
    (rawScore: number, appearances: number): number => {
      if (appearances === 0) return 0;
      return rawScore / appearances;
    },
    []
  );

  // Calculate all scores from round responses
  const calculateScores = useCallback(
    (responses: RoundResponse[]): WIPScoreResult => {
      // Initialize need raw scores
      const needRawScores: Record<string, number> = {};
      needs.forEach((need) => {
        needRawScores[need.id] = 0;
      });

      // Process each response
      responses.forEach((response) => {
        response.rankedNeedIds.forEach((needId, index) => {
          const rank = index + 1; // 0-indexed to 1-indexed
          const points = RANK_TO_POINTS[rank] || 0;
          needRawScores[needId] = (needRawScores[needId] || 0) + points;
        });
      });

      // Build need scores with normalization
      const needScores = needs.map((need) => {
        const rawScore = needRawScores[need.id] || 0;
        const { min, max } = getNeedMinMax(need.id);
        const stdScore = normalizeScore(rawScore, min, max);
        const appearances = needAppearanceMap[need.id] || 0;

        return {
          need,
          rawScore,
          stdScore,
          appearances,
        };
      });

      // Group needs by value
      const needsByValue: Record<string, typeof needScores> = {};
      needScores.forEach((ns) => {
        const valueId = ns.need.value_id;
        if (!needsByValue[valueId]) {
          needsByValue[valueId] = [];
        }
        needsByValue[valueId].push(ns);
      });

      // Calculate value scores
      const valueScores = values.map((value) => {
        const valueNeeds = needsByValue[value.id] || [];
        const rawSum = valueNeeds.reduce((sum, ns) => sum + ns.rawScore, 0);
        const rawMean = valueNeeds.length > 0 ? rawSum / valueNeeds.length : 0;

        // Calculate min/max for value
        const minPossible = valueNeeds.reduce((sum, ns) => {
          const { min } = getNeedMinMax(ns.need.id);
          return sum + min;
        }, 0);
        const maxPossible = valueNeeds.reduce((sum, ns) => {
          const { max } = getNeedMinMax(ns.need.id);
          return sum + max;
        }, 0);

        const stdScore = normalizeScore(rawSum, minPossible, maxPossible);

        return {
          value,
          rawSum,
          rawMean,
          stdScore,
          needCount: valueNeeds.length,
        };
      });

      return { needScores, valueScores };
    },
    [needs, values, needAppearanceMap, getNeedMinMax, normalizeScore]
  );

  // Calculate partial/live scores (for real-time UI updates during assessment)
  const calculatePartialScores = useCallback(
    (responses: RoundResponse[]): WIPScoreResult => {
      return calculateScores(responses);
    },
    [calculateScores]
  );

  // Get top N values by standardized score
  const getTopValues = useCallback(
    (valueScores: WIPScoreResult['valueScores'], n: number = 3) => {
      return [...valueScores]
        .sort((a, b) => b.stdScore - a.stdScore)
        .slice(0, n);
    },
    []
  );

  // Get top N needs by standardized score
  const getTopNeeds = useCallback(
    (needScores: WIPScoreResult['needScores'], n: number = 5) => {
      return [...needScores]
        .sort((a, b) => b.stdScore - a.stdScore)
        .slice(0, n);
    },
    []
  );

  return {
    needAppearanceMap,
    getNeedMinMax,
    normalizeScore,
    calculateMeanScore,
    calculateScores,
    calculatePartialScores,
    getTopValues,
    getTopNeeds,
  };
}

/**
 * Pearson correlation coefficient calculation
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}
