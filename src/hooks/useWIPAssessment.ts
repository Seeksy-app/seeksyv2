import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WIPValue, WIPNeed, WIPRound, WIPAssessment, WIPNeedScore, WIPValueScore } from '@/types/wip';
import { useWIPScoring } from './useWIPScoring';
import { toast } from 'sonner';

interface RoundResponse {
  roundIndex: number;
  rankedNeedIds: string[];
}

export function useWIPAssessment(audiencePath: 'civilian' | 'military' | 'reentry' = 'civilian') {
  const queryClient = useQueryClient();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(1);
  const [responses, setResponses] = useState<RoundResponse[]>([]);

  // Fetch values
  const { data: values = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['wip-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_value')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as WIPValue[];
    },
  });

  // Fetch needs
  const { data: needs = [], isLoading: needsLoading } = useQuery({
    queryKey: ['wip-needs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_need')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as WIPNeed[];
    },
  });

  // Fetch rounds
  const { data: rounds = [], isLoading: roundsLoading } = useQuery({
    queryKey: ['wip-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_round')
        .select('*')
        .eq('is_active', true)
        .order('round_index');
      if (error) throw error;
      return data as WIPRound[];
    },
  });

  // Generate placeholder rounds if none exist (for initial setup)
  const activeRounds = rounds.length > 0 ? rounds : generatePlaceholderRounds(needs);

  // Scoring engine
  const {
    calculateScores,
    calculatePartialScores,
    getTopValues,
    getTopNeeds,
  } = useWIPScoring(needs, values, activeRounds);

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('wip_assessment')
        .insert({
          user_id: user?.id || null,
          audience_path: audiencePath,
          version: 'v1',
        })
        .select()
        .single();
      if (error) throw error;
      return data as WIPAssessment;
    },
    onSuccess: (data) => {
      setAssessmentId(data.id);
    },
  });

  // Save round response mutation
  const saveRoundResponseMutation = useMutation({
    mutationFn: async ({ roundIndex, rankedNeedIds }: RoundResponse) => {
      if (!assessmentId) throw new Error('No assessment started');
      const { error } = await supabase
        .from('wip_round_response')
        .upsert({
          assessment_id: assessmentId,
          round_index: roundIndex,
          ranked_need_ids: rankedNeedIds,
        }, {
          onConflict: 'assessment_id,round_index',
        });
      if (error) throw error;
    },
  });

  // Complete assessment mutation
  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!assessmentId) throw new Error('No assessment started');
      
      // Calculate final scores
      const scores = calculateScores(responses);

      // Save need scores
      const needScoreInserts = scores.needScores.map((ns) => ({
        assessment_id: assessmentId,
        need_id: ns.need.id,
        raw_score: ns.rawScore,
        std_score_0_100: ns.stdScore,
        appearances: ns.appearances,
        min_possible: ns.appearances * 1, // rank 5 = 1 point
        max_possible: ns.appearances * 5, // rank 1 = 5 points
      }));

      const { error: needError } = await supabase
        .from('wip_need_score')
        .insert(needScoreInserts);
      if (needError) throw needError;

      // Save value scores
      const valueScoreInserts = scores.valueScores.map((vs) => ({
        assessment_id: assessmentId,
        value_id: vs.value.id,
        raw_sum: vs.rawSum,
        raw_mean: vs.rawMean,
        std_score_0_100: vs.stdScore,
        min_possible: 0, // Will be calculated properly with real rounds
        max_possible: 100,
      }));

      const { error: valueError } = await supabase
        .from('wip_value_score')
        .insert(valueScoreInserts);
      if (valueError) throw valueError;

      // Mark assessment as completed
      const { error: updateError } = await supabase
        .from('wip_assessment')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', assessmentId);
      if (updateError) throw updateError;

      return scores;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wip-assessment', assessmentId] });
      toast.success('Assessment completed!');
    },
  });

  // Start a new assessment
  const startAssessment = useCallback(async () => {
    setResponses([]);
    setCurrentRoundIndex(1);
    await createAssessmentMutation.mutateAsync();
  }, [createAssessmentMutation]);

  // Submit a round response
  const submitRound = useCallback(
    async (rankedNeedIds: string[]) => {
      const response: RoundResponse = {
        roundIndex: currentRoundIndex,
        rankedNeedIds,
      };

      // Save to database
      await saveRoundResponseMutation.mutateAsync(response);

      // Update local state
      setResponses((prev) => {
        const existing = prev.findIndex((r) => r.roundIndex === currentRoundIndex);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = response;
          return updated;
        }
        return [...prev, response];
      });

      // Move to next round or complete
      if (currentRoundIndex < activeRounds.length) {
        setCurrentRoundIndex((prev) => prev + 1);
      }
    },
    [currentRoundIndex, activeRounds.length, saveRoundResponseMutation]
  );

  // Go back to previous round
  const goBack = useCallback(() => {
    if (currentRoundIndex > 1) {
      setCurrentRoundIndex((prev) => prev - 1);
    }
  }, [currentRoundIndex]);

  // Complete the assessment
  const completeAssessment = useCallback(async () => {
    return await completeAssessmentMutation.mutateAsync();
  }, [completeAssessmentMutation]);

  // Get current round data
  const getCurrentRound = useCallback(() => {
    const round = activeRounds.find((r) => r.round_index === currentRoundIndex);
    if (!round) return null;

    const roundNeeds = round.need_ids
      .map((id) => needs.find((n) => n.id === id))
      .filter(Boolean) as WIPNeed[];

    return {
      ...round,
      needs: roundNeeds,
    };
  }, [activeRounds, currentRoundIndex, needs]);

  // Get live/partial scores for real-time display
  const getLiveScores = useCallback(() => {
    if (responses.length === 0) return null;
    return calculatePartialScores(responses);
  }, [responses, calculatePartialScores]);

  // Check if assessment is complete
  const isComplete = currentRoundIndex > activeRounds.length;
  const isLoading = valuesLoading || needsLoading || roundsLoading;
  const totalRounds = activeRounds.length;
  const progress = ((currentRoundIndex - 1) / totalRounds) * 100;

  return {
    // Data
    values,
    needs,
    rounds: activeRounds,
    assessmentId,
    currentRoundIndex,
    totalRounds,
    progress,
    isComplete,
    isLoading,

    // Actions
    startAssessment,
    submitRound,
    goBack,
    completeAssessment,
    getCurrentRound,
    getLiveScores,
    getTopValues,
    getTopNeeds,

    // Mutation states
    isStarting: createAssessmentMutation.isPending,
    isSaving: saveRoundResponseMutation.isPending,
    isCompleting: completeAssessmentMutation.isPending,
  };
}

// Generate placeholder rounds for initial setup (until official matrix is loaded)
function generatePlaceholderRounds(needs: WIPNeed[]): WIPRound[] {
  if (needs.length < 21) return [];

  // Create 21 rounds, each with 5 different needs
  // This is a simple distribution - will be replaced with official matrix
  const rounds: WIPRound[] = [];
  const shuffledNeeds = [...needs].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 21; i++) {
    const startIndex = (i * 5) % needs.length;
    const roundNeeds: string[] = [];
    
    for (let j = 0; j < 5; j++) {
      const needIndex = (startIndex + j * 4) % needs.length;
      const need = shuffledNeeds[needIndex];
      if (need && !roundNeeds.includes(need.id)) {
        roundNeeds.push(need.id);
      }
    }

    // Fill any remaining slots
    while (roundNeeds.length < 5) {
      const randomNeed = shuffledNeeds.find((n) => !roundNeeds.includes(n.id));
      if (randomNeed) roundNeeds.push(randomNeed.id);
    }

    rounds.push({
      id: `placeholder-${i + 1}`,
      round_index: i + 1,
      need_ids: roundNeeds.slice(0, 5),
      is_active: true,
      version: 'placeholder',
    });
  }

  return rounds;
}
