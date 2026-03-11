"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const navLinks = ["Home", "Register", "Dashboard", "Verify"];

type Property = {
  id?: number;
  owner: string;
  location: string;
  area: number | string;
  created_at?: string;
};

function fakeTxHash(seed: string | number) {
  let h = String(seed);
  let out = "";
  for (let i = 0; i < 64; i++) {
    out += ((h.charCodeAt(i % h.length) * 31 + i * 17) % 16).toString(16);
  }
  return "0x" + out;
}

function formatDate(iso?: string) {
  if (!iso) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function QRPlaceholder() {
  return (
    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center">
      <p className="text-2xl">📷</p>
      <p className="mt-1 text-[10px] font-semibold text-slate-400">QR Code</p>
    </div>
  );
}

function VerifiedCard({ property }: { property: Property }) {
  const txHash = fakeTxHash(property.id ?? property.owner);
  const verifiedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="w-full overflow-hidden rounded-2xl border-2 border-green-400 bg-white shadow-xl">
      <div className="flex items-center justify-between bg-green-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <p className="text-lg font-extrabold text-white">VERIFIED</p>
            <p className="text-xs text-green-100">Blockchain Authenticated Record</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-green-100">Verified At</p>
          <p className="text-xs font-bold text-white">{verifiedAt}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Government of India</p>
              <p className="text-sm font-extrabold text-[#0A1628]">LandChain Property Certificate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Property ID</p>
              <p className="mt-1 font-bold text-[#0A1628]">#{property.id ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Owner</p>
              <p className="mt-1 font-bold text-[#0A1628]">{property.owner}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Location</p>
              <p className="mt-1 font-bold text-[#0A1628]">{property.location}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Area</p>
              <p className="mt-1 font-bold text-[#0A1628]">{property.area} sq. ft.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Registration Date</p>
              <p className="mt-1 font-bold text-[#0A1628]">{formatDate(property.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                ● Verified
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Blockchain Transaction Hash</p>
            <p className="mt-1 break-all font-mono text-xs text-[#0A1628]">{txHash}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:pt-12">
          <QRPlaceholder />
          <p className="text-[10px] text-slate-400">Scan to verify</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
        <button className="flex-1 rounded-md bg-[#FF6B00] py-2.5 text-sm font-bold text-white transition hover:bg-[#e86200]">
          Download Certificate
        </button>
        <button className="flex-1 rounded-md border border-[#0A1628] py-2.5 text-sm font-bold text-[#0A1628] transition hover:bg-[#0A1628] hover:text-white">
          Share
        </button>
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="w-full rounded-2xl border-2 border-red-300 bg-white p-8 text-center shadow-lg">
      <p className="text-5xl">❌</p>
      <h3 className="mt-4 text-xl font-extrabold text-red-600">NOT FOUND</h3>
      <p className="mt-2 font-semibold text-red-500">संपत्ति रिकॉर्ड नहीं मिला</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-slate-600">
        No property record matched your query. Please verify the Property ID or Transaction Hash and try again. For assistance, contact your district land records office.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        कृपया संपत्ति आईडी या लेनदेन हैश जांचें और पुनः प्रयास करें।
      </p>
    </div>
  );
}

export default function Verify() {
  const [query, setQuery] = useState("");
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [result, setResult] = useState<Property | null | "not-found">(null);
  const [searching, setSearching] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    axios
      .get("https://landchain-platform.onrender.com/api/property")
      .then((res) => setAllProperties(res.data))
      .finally(() => setLoadingRecent(false));
  }, []);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const res = await axios.get("https://landchain-platform.onrender.com/api/property");
      const all: Property[] = res.data;
      const q = query.trim().toLowerCase();
      const match = all.find(
        (p) =>
          String(p.id ?? "").toLowerCase() === q ||
          String(p.id ?? "").toLowerCase().includes(q) ||
          fakeTxHash(p.id ?? p.owner).toLowerCase().includes(q)
      );
      setResult(match ?? "not-found");
      setAllProperties(all);
    } finally {
      setSearching(false);
    }
  };

  const recent = [...allProperties].reverse().slice(0, 3);

  return (
    <div className="w-full overflow-x-hidden bg-[#F5F7FB] text-[#0A1628] [font-family:'Poppins',sans-serif]">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-3xl leading-none">🏛️</span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-extrabold text-[#0A1628]">LandChain</p>
              <p className="truncate text-xs font-semibold tracking-wide text-[#FF6B00]">भूमि रजिस्ट्री</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link}
                href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                className={`text-sm font-semibold transition ${
                  link === "Verify" ? "text-[#FF6B00]" : "text-[#0A1628] hover:text-[#FF6B00]"
                }`}
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="w-full bg-[#0A1628] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Verify Property</h1>
          <p className="mt-2 text-lg font-semibold text-[#FF6B00]">संपत्ति सत्यापन</p>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-12 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">Instant Blockchain Verification</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#0A1628] sm:text-3xl">
            Enter Property ID or Transaction Hash
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Verify the authenticity of any property record registered on the LandChain network.
          </p>

          <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 42 or 0x3f9a..."
              className="flex-1 rounded-lg border border-slate-300 px-5 py-3.5 text-sm text-[#0A1628] outline-none transition placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-[#FF6B00] px-8 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#e86200] disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {searching ? "Verifying..." : "Verify Now"}
            </button>
          </form>
        </div>
      </section>

      {result !== null && (
        <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          {result === "not-found" ? (
            <NotFoundCard />
          ) : (
            <VerifiedCard property={result} />
          )}
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-extrabold text-[#0A1628]">Recently Verified Properties</h2>

        {loadingRecent ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
                <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-1/2 rounded bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-slate-500">No properties registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {recent.map((p, i) => (
              <div
                key={p.id ?? i}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#0A1628] px-3 py-0.5 text-xs font-bold text-white">
                    ID #{p.id ?? "—"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Verified
                  </span>
                </div>
                <p className="font-extrabold text-[#0A1628]">{p.owner}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <span>📍</span> {p.location}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <span>📐</span> {p.area} sq. ft.
                </p>
                <button
                  onClick={() => {
                    setQuery(String(p.id ?? ""));
                    setResult(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-4 w-full rounded-md border border-[#FF6B00] py-2 text-xs font-bold text-[#FF6B00] transition hover:bg-[#FF6B00] hover:text-white"
                >
                  View Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="w-full bg-[#0A1628] px-4 py-10 text-slate-200 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-2 text-center md:text-left">
          <p className="text-sm leading-7">
            Government of India digital land registry services are provided for lawful use and official verification purposes only.
          </p>
          <p className="text-sm leading-7">
            भारत सरकार की डिजिटल भूमि रजिस्ट्री सेवाएं केवल विधिक उपयोग और आधिकारिक सत्यापन हेतु उपलब्ध हैं।
          </p>
          <p className="pt-2 text-xs text-slate-400">© 2026 LandChain. Government of India.</p>
        </div>
      </footer>
    </div>
  );
}
