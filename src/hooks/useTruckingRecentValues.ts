import { useState, useEffect } from "react";

const STORAGE_KEY = "trucking_recent_values";
const MAX_RECENT = 20;

interface RecentValuesStore {
  [key: string]: string[];
}

export function useTruckingRecentValues() {
  const [recentValues, setRecentValues] = useState<RecentValuesStore>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentValues(JSON.parse(stored));
      } catch {
        setRecentValues({});
      }
    }
  }, []);

  const addRecentValue = (field: string, value: string) => {
    if (!value || !value.trim()) return;
    
    setRecentValues((prev) => {
      const fieldValues = prev[field] || [];
      // Remove if exists, add to front
      const filtered = fieldValues.filter((v) => v.toLowerCase() !== value.toLowerCase());
      const updated = [value, ...filtered].slice(0, MAX_RECENT);
      const newStore = { ...prev, [field]: updated };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
      return newStore;
    });
  };

  const getRecentValues = (field: string): string[] => {
    return recentValues[field] || [];
  };

  const clearRecentValues = (field: string) => {
    setRecentValues((prev) => {
      const newStore = { ...prev };
      delete newStore[field];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
      return newStore;
    });
  };

  return { getRecentValues, addRecentValue, clearRecentValues };
}
