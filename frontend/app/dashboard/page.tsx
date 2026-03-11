"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type Property = {
  id?: number;
  owner: string;
  location: string;
  area: number | string;
  created_at?: string;
};

const navLinks = ["Home", "Register", "Dashboard", "Verify"];

const indianStates = [
  "All States",
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const propertyTypes = ["All Types", "Agricultural", "Residential", "Commercial", "Industrial"];
const statuses = ["All", "Verified", "Pending"];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 h-5 w-20 rounded-full bg-slate-200" />
      <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
      <div className="mb-2 h-4 w-1/2 rounded bg-slate-200" />
      <div className="mb-4 h-4 w-1/3 rounded bg-slate-200" />
      <div className="flex gap-3">
        <div className="h-9 flex-1 rounded-md bg-slate-200" />
        <div className="h-9 flex-1 rounded-md bg-slate-200" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl">🗺️</p>
      <h3 className="mt-5 text-xl font-bold text-[#0A1628]">No Properties Found</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        No records match your current search or filter criteria. Try adjusting your filters or register a new property.
      </p>
      <button className="mt-6 rounded-md bg-[#FF6B00] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#e86200]">
        Register Property
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All States");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/property")
      .then((res) => setProperties(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.owner?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      String(p.id ?? "").includes(q);
    const matchesState =
      stateFilter === "All States" ||
      p.location?.toLowerCase().includes(stateFilter.toLowerCase());
    return matchesSearch && matchesState;
  });

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
                  link === "Dashboard" ? "text-[#FF6B00]" : "text-[#0A1628] hover:text-[#FF6B00]"
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
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Property Dashboard</h1>
          <p className="mt-2 text-lg font-semibold text-[#FF6B00]">संपत्ति डैशबोर्ड</p>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="relative w-full">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by owner name, location or property ID..."
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-[#0A1628] outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            >
              {indianStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            >
              {propertyTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!loading && (
          <p className="mb-6 text-sm font-semibold text-slate-600">
            Showing{" "}
            <span className="font-extrabold text-[#0A1628]">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "property" : "properties"}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((property, index) => (
              <article
                key={property.id ?? `${property.owner}-${index}`}
                className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <span className="inline-flex w-fit items-center rounded-full bg-[#0A1628] px-3 py-0.5 text-xs font-bold text-white">
                    ID #{property.id ?? index + 1}
                  </span>

                  <h3 className="text-base font-extrabold text-[#0A1628] leading-snug">{property.owner}</h3>

                  <div className="flex items-start gap-1.5 text-sm text-slate-600">
                    <span className="mt-0.5 text-base leading-none">📍</span>
                    <span>{property.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="text-base leading-none">📐</span>
                    <span>{property.area} sq. ft.</span>
                  </div>

                  {property.created_at && (
                    <p className="text-xs text-slate-400">
                      Registered:{" "}
                      {new Date(property.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 border-t border-slate-100 p-4">
                  <button className="flex-1 rounded-md bg-[#FF6B00] py-2 text-xs font-bold text-white transition hover:bg-[#e86200]">
                    View Certificate
                  </button>
                  <button className="flex-1 rounded-md border border-[#0A1628] py-2 text-xs font-bold text-[#0A1628] transition hover:bg-[#0A1628] hover:text-white">
                    Verify on Chain
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

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
