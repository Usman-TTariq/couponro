import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StorePageLoading() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-almond flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex gap-5 items-center mb-8 animate-pulse">
          <div className="w-24 h-24 rounded-2xl bg-rebecca/10 flex-shrink-0" />
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>
        </div>
        <ul className="space-y-0 rounded-2xl border-2 border-rebecca/15 bg-white overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex gap-5 p-5 sm:p-6 border-b border-rebecca/10 animate-pulse">
              <div className="w-20 h-20 rounded-2xl bg-almond flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
              <div className="w-28 h-12 bg-lobster/30 rounded-xl flex-shrink-0" />
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
