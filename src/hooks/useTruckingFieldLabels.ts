import { useState, useEffect } from "react";

const STORAGE_KEY = "trucking_field_labels";

export interface FieldLabels {
  reference: string;
  shipper_name: string;
  contact_name: string;
  pickup_city: string;
  delivery_city: string;
}

const DEFAULT_LABELS: FieldLabels = {
  reference: "Reference",
  shipper_name: "Shipper Name",
  contact_name: "Main Contact Name",
  pickup_city: "City",
  delivery_city: "City",
};

export function useTruckingFieldLabels() {
  const [labels, setLabels] = useState<FieldLabels>(DEFAULT_LABELS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLabels({ ...DEFAULT_LABELS, ...JSON.parse(stored) });
      } catch {
        setLabels(DEFAULT_LABELS);
      }
    }
  }, []);

  const updateLabel = (field: keyof FieldLabels, value: string) => {
    setLabels((prev) => {
      const updated = { ...prev, [field]: value || DEFAULT_LABELS[field] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetLabels = () => {
    setLabels(DEFAULT_LABELS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { labels, updateLabel, resetLabels, DEFAULT_LABELS };
}
