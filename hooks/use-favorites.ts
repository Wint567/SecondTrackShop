"use client";

import { useCallback, useSyncExternalStore } from "react";
import { parseFavoriteIds } from "@/utils/favorites";

const STORAGE_KEY = "secondtrack-favorites";
const CHANGE_EVENT = "secondtrack-favorites-change";
const EMPTY_SNAPSHOT = "[]";

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
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
};

const getServerSnapshot = () => EMPTY_SNAPSHOT;

export function useFavorites() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const favorites = new Set(parseFavoriteIds(snapshot));

  const toggleFavorite = useCallback((id: string) => {
    try {
      const next = new Set(
        parseFavoriteIds(window.localStorage.getItem(STORAGE_KEY)),
      );

      if (next.has(id)) next.delete(id);
      else next.add(id);

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Favorites remain usable as a no-op when storage is blocked by the browser.
    }
  }, []);

  return { favorites, toggleFavorite };
}
