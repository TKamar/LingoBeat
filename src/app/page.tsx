import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-6 bg-background text-foreground">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">LingoBeat</h1>
        <p className="text-slate-400 text-lg">Learn any language through music.</p>
      </div>
      <Link
        href="/player/demo"
        className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
      >
        Try the demo →
      </Link>
    </main>
  );
}
