import { reasoningChains } from "@/lib/fixtures";

/**
 * One route per authored reasoning chain. Unknown IDs fall through to the
 * page's own empty state on web; on native only these paths exist.
 */
export function generateStaticParams() {
  return reasoningChains.map((chain) => ({ id: chain.id }));
}

export default function ReasoningLayout({ children }: { children: React.ReactNode }) {
  return children;
}
