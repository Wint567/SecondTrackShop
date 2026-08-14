"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types/product";
import { isAbortError } from "@/utils/request";
import type { StoreErrorInfo } from "@/utils/store-state";

type AsyncState<T> = {
  data: T;
  error: Error | null;
  loading: boolean;
  retry: () => void;
};

let clientProductCache: Product[] | undefined;

export function useStoreItems(
  initialData?: Product[],
  initialError: StoreErrorInfo | null = null,
  enabled = true,
): AsyncState<Product[]> {
  const [seededData] = useState<Product[] | undefined>(() => {
    const cachedData = typeof window === "undefined" ? undefined : clientProductCache;
    if (typeof window !== "undefined" && initialData !== undefined && !initialError) {
      clientProductCache = initialData;
    }
    return initialData ?? cachedData;
  });
  const hasInitialState = seededData !== undefined;
  const [data, setData] = useState<Product[]>(seededData ?? []);
  const [loading, setLoading] = useState(!hasInitialState && enabled);
  const [error, setError] = useState<Error | null>(
    initialError ? new Error(initialError.code) : null,
  );
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (!enabled || (hasInitialState && request === 0)) return;

    let active = true;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    });

    import("@/services/store")
      .then(({ fetchPublicItems }) => fetchPublicItems(controller.signal))
      .then((items) => {
        if (active) {
          clientProductCache = items;
          setData(items);
        }
      })
      .catch((cause: unknown) => {
        if (active && !controller.signal.aborted && !isAbortError(cause))
          setError(cause instanceof Error ? cause : new Error("store-load-failed"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, hasInitialState, request]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequest((value) => value + 1);
  }, []);
  return { data, error, loading, retry };
}

export function useStoreItem(slug: string, initialData?: Product): AsyncState<Product | null> {
  const [data, setData] = useState<Product | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (initialData && request === 0) return;

    let active = true;
    const controller = new AbortController();

    import("@/services/store")
      .then(({ fetchPublicItemBySlug }) => fetchPublicItemBySlug(slug, controller.signal))
      .then((item) => {
        if (active) setData(item);
      })
      .catch((cause: unknown) => {
        if (active && !controller.signal.aborted && !isAbortError(cause))
          setError(cause instanceof Error ? cause : new Error("item-load-failed"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [initialData, request, slug]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequest((value) => value + 1);
  }, []);
  return { data, error, loading, retry };
}

export function useRelatedStoreItems(
  category: string,
  excludedId: string,
  initialData?: Product[],
  initialError = false,
): AsyncState<Product[]> {
  const hasInitialState = initialData !== undefined;
  const [data, setData] = useState<Product[]>(initialData ?? []);
  const [loading, setLoading] = useState(Boolean(category) && !hasInitialState);
  const [error, setError] = useState<Error | null>(
    initialError ? new Error("related-load-failed") : null,
  );
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (!category || !excludedId || (hasInitialState && request === 0)) return;

    let active = true;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    });

    import("@/services/store")
      .then(({ fetchRelatedPublicItems }) =>
        fetchRelatedPublicItems(category, excludedId, controller.signal),
      )
      .then((items) => {
        if (active) setData(items);
      })
      .catch((cause: unknown) => {
        if (active && !controller.signal.aborted && !isAbortError(cause))
          setError(cause instanceof Error ? cause : new Error("related-load-failed"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [category, excludedId, hasInitialState, request]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequest((value) => value + 1);
  }, []);
  return { data, error, loading, retry };
}
