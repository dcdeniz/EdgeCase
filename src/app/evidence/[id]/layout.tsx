import { evidence } from "@/lib/fixtures";

/**
 * The page itself is a client component and cannot export this, so the param
 * set lives on a pass-through server layout. The evidence registry is a closed
 * set, so every card prerenders for the static native bundle.
 */
export function generateStaticParams() {
  return evidence.map((claim) => ({ id: claim.id }));
}

export default function EvidenceDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
