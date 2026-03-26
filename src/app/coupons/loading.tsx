import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CouponsLoading() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-[#f0f5fa] flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="h-5 w-full max-w-md bg-slate-100 rounded animate-pulse mb-8" />
        <ul className="space-y-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex gap-4 p-4 sm:p-5 border-b border-slate-200 animate-pulse">
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="w-32 h-10 bg-slate-200 rounded flex-shrink-0" />
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
