export function parseFavoriteIds(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter((item): item is string => typeof item === "string" && item.length > 0),
      ),
    ];
  } catch {
    return [];
  }
}
