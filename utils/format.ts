export function parsePublicPrice(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === "boolean") {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") return null;
  const price = typeof value === "number" ? value : Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function formatPrice(price: number | null) {
  if (price === null || !Number.isFinite(price)) return "Цена по запросу";

  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
    currency: "PLN",
  })
    .format(price)
    .replace("PLN", "zł");
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
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) return `${count} товаров`;
  if (mod10 === 1) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} товара`;
  return `${count} товаров`;
}
