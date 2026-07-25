export default function Home() {
  const stack = [["Frontend", "Next.js 16 · App Router"], ["Backend", "Supabase · Edge + Postgres"], ["Observability", "NEAT · OpenTelemetry"]];
  return <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-6 py-20">
    <section className="max-w-3xl space-y-6">
      <p className="font-mono text-sm uppercase tracking-[0.25em] text-emerald-400">Hackathon foundation</p>
      <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Build the edge case first.</h1>
      <p className="max-w-2xl text-lg leading-8 text-zinc-400">Next.js App Router on Vercel, Supabase Edge Functions and Postgres, with contracts and decisions kept close to the code.</p>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">{stack.map(([title, detail]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="font-medium text-white">{title}</h2><p className="mt-2 text-sm text-zinc-400">{detail}</p></article>)}</section>
    <a className="w-fit rounded-full bg-emerald-400 px-5 py-3 font-medium text-zinc-950 hover:bg-emerald-300" href="/api/health">Check frontend health</a>
  </main>;
}
