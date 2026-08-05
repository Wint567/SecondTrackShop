const RESPONSIVE_WIDTHS = [240, 480, 720, 960];
const OBJECT_MARKER = "/storage/v1/object/public/item-photos/";

export function getResponsiveImageCandidates(src: string): string[] {
  try {
    const source = new URL(src);
    const publicSupabaseImage =
      source.protocol === "https:" &&
      source.hostname.endsWith(".supabase.co") &&
      source.pathname.includes(OBJECT_MARKER);
    if (!publicSupabaseImage) return [];

    source.pathname = source.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    return RESPONSIVE_WIDTHS.map((width) => {
      const candidate = new URL(source);
      candidate.searchParams.set("width", String(width));
      candidate.searchParams.set("quality", "78");
      candidate.searchParams.set("resize", "contain");
      return `${candidate.toString()} ${width}w`;
    });
  } catch {
    return [];
  }
}
