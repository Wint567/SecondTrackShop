import type { ProductPhoto } from "@/types/product";

export function selectProductPhotos(
  photos: ProductPhoto[],
  itemId: string,
  primaryPhotoId: string | null,
): ProductPhoto[] {
  const seenUrls = new Set<string>();
  const itemPhotos = photos
    .filter((photo) => photo.itemId === itemId && photo.url)
    .filter((photo) => {
      if (seenUrls.has(photo.url)) return false;
      seenUrls.add(photo.url);
      return true;
    })
    .sort((first, second) => first.order - second.order);

  const primaryIndex = itemPhotos.findIndex(
    (photo) => photo.id === primaryPhotoId,
  );
  if (primaryIndex > 0) {
    const [primary] = itemPhotos.splice(primaryIndex, 1);
    itemPhotos.unshift(primary);
  }

  return itemPhotos;
}
