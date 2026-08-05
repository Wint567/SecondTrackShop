export const PUBLIC_STORE_REVALIDATE_SECONDS = 300;

type NextFetchOptions = {
  revalidate?: number;
  tags?: string[];
};

export type PublicStoreRequestInit = RequestInit & {
  next?: NextFetchOptions;
};

/** Adds the App Router revalidation hint to public, read-only store requests. */
export function withPublicStoreRevalidation(init?: RequestInit): PublicStoreRequestInit {
  const portableInit = { ...init } as PublicStoreRequestInit;
  const currentNext = portableInit.next;
  delete portableInit.cache;

  return {
    ...portableInit,
    next: {
      ...currentNext,
      revalidate: PUBLIC_STORE_REVALIDATE_SECONDS,
    },
  };
}
