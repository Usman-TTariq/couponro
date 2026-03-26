import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoresLoading() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-almond flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="h-10 w-64 bg-rebecca/10 rounded animate-pulse mx-auto mb-6" />
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-9 h-9 bg-rebecca/10 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-rebecca/15 bg-white p-5 animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-xl bg-almond mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
