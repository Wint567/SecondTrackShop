"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseFavoriteIds } from "@/utils/favorites";

const STORAGE_KEY = "secondtrack-favorites";
const CHANGE_EVENT = "secondtrack-favorites-change";
const EMPTY_SNAPSHOT = "[]";
let memorySnapshot = EMPTY_SNAPSHOT;

const subscribe = (listener: () => void) => {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};

const getSnapshot = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? memorySnapshot;
    memorySnapshot = stored;
    return stored;
  } catch {
    return memorySnapshot;
  }
};

const getServerSnapshot = () => EMPTY_SNAPSHOT;
const subscribeHydration = () => () => undefined;

const storeFavorites = (ids: Iterable<string>) => {
  memorySnapshot = JSON.stringify([...new Set(ids)]);
  try {
    window.localStorage.setItem(STORAGE_KEY, memorySnapshot);
  } catch {
    // The in-memory snapshot keeps favorites usable when storage is blocked.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export function useFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const favorites = useMemo(() => new Set(parseFavoriteIds(snapshot)), [snapshot]);
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );

  const toggleFavorite = useCallback((id: string) => {
    try {
      const next = new Set(parseFavoriteIds(window.localStorage.getItem(STORAGE_KEY)));

      if (next.has(id)) next.delete(id);
      else next.add(id);

      storeFavorites(next);
    } catch {
      const next = new Set(parseFavoriteIds(memorySnapshot));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      storeFavorites(next);
    }
  }, []);

  const clearFavorites = useCallback(() => {
    storeFavorites([]);
  }, []);

  const replaceFavorites = useCallback((ids: Iterable<string>) => {
    storeFavorites(ids);
  }, []);

  return { clearFavorites, favorites, hydrated, replaceFavorites, toggleFavorite };
}
