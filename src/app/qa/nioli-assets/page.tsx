import { notFound } from "next/navigation";

export default async function NioliAssetGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { NioliAssetGallery } = await import("@/features/nioli/asset-gallery");

  return <NioliAssetGallery />;
}
