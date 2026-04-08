import { useCallback, useEffect, useState } from "react";
import type { Product } from "../types";

const STORAGE_KEY = "shoapzy_compare";
const MAX_COMPARE = 4;

function loadFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

function saveToStorage(items: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function useCompare() {
  const [compareItems, setCompareItems] = useState<Product[]>(loadFromStorage);

  // Sync to localStorage whenever list changes
  useEffect(() => {
    saveToStorage(compareItems);
  }, [compareItems]);

  const addToCompare = useCallback((product: Product) => {
    setCompareItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  const isInCompare = useCallback(
    (productId: string) => compareItems.some((p) => p.id === productId),
    [compareItems],
  );

  const canAdd = compareItems.length < MAX_COMPARE;

  return {
    compareItems,
    compareCount: compareItems.length,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAdd,
    maxCompare: MAX_COMPARE,
  };
}
