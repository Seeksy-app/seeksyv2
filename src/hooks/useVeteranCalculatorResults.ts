import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SavedResult {
  id: string;
  calculator_id: string;
  input_json: Record<string, any>;
  output_json: Record<string, any>;
  summary?: string;
  created_at: string;
}

interface UseVeteranCalculatorResultsReturn {
  results: SavedResult[];
  loading: boolean;
  save: (inputs: Record<string, any>, outputs: Record<string, any>, summary?: string) => Promise<boolean>;
  deleteResult: (id: string) => Promise<boolean>;
  isLoggedIn: boolean;
}

const LOCAL_STORAGE_KEY = 'veteran_calculator_results';

export function useVeteranCalculatorResults(calculatorId: string): UseVeteranCalculatorResultsReturn {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load results
  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      
      if (userId) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('veteran_calculator_results')
          .select('*')
          .eq('calculator_id', calculatorId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setResults(data as SavedResult[]);
        }
      } else {
        // Load from localStorage
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const allResults = JSON.parse(stored) as SavedResult[];
            setResults(allResults.filter(r => r.calculator_id === calculatorId).slice(0, 10));
          }
        } catch {
          setResults([]);
        }
      }
      
      setLoading(false);
    };

    loadResults();
  }, [calculatorId, userId]);

  const save = async (inputs: Record<string, any>, outputs: Record<string, any>, summary?: string): Promise<boolean> => {
    const newResult: SavedResult = {
      id: crypto.randomUUID(),
      calculator_id: calculatorId,
      input_json: inputs,
      output_json: outputs,
      summary,
      created_at: new Date().toISOString(),
    };

    if (userId) {
      // Save to Supabase
      const { error } = await supabase
        .from('veteran_calculator_results')
        .insert({
          user_id: userId,
          calculator_id: calculatorId,
          input_json: inputs,
          output_json: outputs,
          summary,
        });

      if (error) {
        toast({
          title: "Error saving results",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Reload results
      const { data } = await supabase
        .from('veteran_calculator_results')
        .select('*')
        .eq('calculator_id', calculatorId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setResults(data as SavedResult[]);
      }
    } else {
      // Save to localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const allResults = stored ? JSON.parse(stored) as SavedResult[] : [];
        allResults.unshift(newResult);
        // Keep only last 50 results total
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allResults.slice(0, 50)));
        setResults(allResults.filter(r => r.calculator_id === calculatorId).slice(0, 10));
      } catch {
        toast({
          title: "Error saving results",
          description: "Could not save to local storage",
          variant: "destructive",
        });
        return false;
      }
    }

    toast({
      title: "Results saved",
      description: "Your calculation has been saved successfully.",
    });
    return true;
  };

  const deleteResult = async (id: string): Promise<boolean> => {
    if (userId) {
      const { error } = await supabase
        .from('veteran_calculator_results')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error deleting result",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setResults(prev => prev.filter(r => r.id !== id));
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const allResults = JSON.parse(stored) as SavedResult[];
          const filtered = allResults.filter(r => r.id !== id);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
          setResults(filtered.filter(r => r.calculator_id === calculatorId).slice(0, 10));
        }
      } catch {
        return false;
      }
    }

    toast({
      title: "Result deleted",
    });
    return true;
  };

  return {
    results,
    loading,
    save,
    deleteResult,
    isLoggedIn: !!userId,
  };
}
