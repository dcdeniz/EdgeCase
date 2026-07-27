import { markerCatalogue } from "@/lib/clinical";

/**
 * Marker codes are a closed catalogue that matches the database check
 * constraint, so every marker detail route prerenders.
 */
export function generateStaticParams() {
  return Object.keys(markerCatalogue).map((code) => ({ code }));
}

export default function MarkerDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
