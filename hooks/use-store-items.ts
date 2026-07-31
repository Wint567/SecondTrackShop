"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchPublicItemBySlug,
  fetchPublicItems,
  fetchRelatedPublicItems,
} from "@/services/store";
import type { Product } from "@/types/product";

type AsyncState<T> = {
  data: T;
  error: boolean;
  loading: boolean;
  retry: () => void;
};

export function useStoreItems(
  initialData?: Product[],
  initialError = false,
): AsyncState<Product[]> {
  const hasInitialState = initialData !== undefined;
  const [data, setData] = useState<Product[]>(initialData ?? []);
  const [loading, setLoading] = useState(!hasInitialState);
  const [error, setError] = useState(initialError);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (hasInitialState && request === 0) return;

    let active = true;

    fetchPublicItems()
      .then((items) => {
        if (active) setData(items);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasInitialState, request]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setRequest((value) => value + 1);
  }, []);
  return { data, error, loading, retry };
}

export function useStoreItem(
  slug: string,
  initialData?: Product,
): AsyncState<Product | null> {
  const [data, setData] = useState<Product | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (initialData && request === 0) return;

    let active = true;

    fetchPublicItemBySlug(slug)
      .then((item) => {
        if (active) setData(item);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialData, request, slug]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setRequest((value) => value + 1);
  }, []);
  return { data, error, loading, retry };
}

export function useRelatedStoreItems(
  category: string,
  excludedId: string,
): AsyncState<Product[]> {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(Boolean(category));
  const [error, setError] = useState(false);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (!category || !excludedId) return;

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(false);
      }
    });

    fetchRelatedPublicItems(category, excludedId)
      .then((items) => {
        if (active) setData(items);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, excludedId, request]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setRequest((value) => value + 1);
  }, []);
  return { data, error, loading, retry };
}
