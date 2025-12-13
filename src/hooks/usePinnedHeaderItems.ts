import { useState, useEffect } from 'react';

export type HeaderItemId = 'knowledge-hub' | 'daily-brief' | 'docs' | 'glossary';

export interface HeaderItem {
  id: HeaderItemId;
  label: string;
  route?: string;
  action?: 'glossary' | 'daily-brief';
}

const STORAGE_KEY = 'seeksy-pinned-header-items';

export function usePinnedHeaderItems() {
  const [pinnedItems, setPinnedItems] = useState<HeaderItemId[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  const togglePin = (itemId: HeaderItemId) => {
    setPinnedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isPinned = (itemId: HeaderItemId) => pinnedItems.includes(itemId);

  return { pinnedItems, togglePin, isPinned };
}

export const headerItems: HeaderItem[] = [
  { id: 'knowledge-hub', label: 'Knowledge Hub', route: '/kb' },
  { id: 'daily-brief', label: 'Daily Brief', route: '/daily-brief' },
  { id: 'docs', label: 'Docs', route: '/board/docs' },
  { id: 'glossary', label: 'Glossary', action: 'glossary' },
];
