export function parsePublicPrice(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === "boolean") {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") return null;
  const price = typeof value === "number" ? value : Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function formatPrice(price: number | null) {
  if (price === null || !Number.isFinite(price)) return "Price on request";

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
    currency: "PLN",
  }).format(price);
}

export function formatArchivePrice(price: number | null) {
  if (price === null || !Number.isFinite(price)) return "Price on request";

  return `${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price)} PLN`;
}

export function isSafeExternalUrl(value: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "vinted.pl" || url.hostname.endsWith(".vinted.pl"))
    );
  } catch {
    return false;
  }
}

export function pluralizeProducts(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}
