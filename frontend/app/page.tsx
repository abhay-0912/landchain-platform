"use client";

import Link from "next/link";

const links = ["Register", "Dashboard", "Verify"];

const stats = [
  { value: "1.2M", label: "Properties Registered" },
  { value: "28", label: "States Connected" },
  { value: "99.9%", label: "Uptime" },
  { value: "0", label: "Frauds Recorded" },
];

const features = [
  {
    icon: "🔗",
    title: "Blockchain Secured",
    description: "Every land record is cryptographically sealed and securely stored\non an immutable distributed ledger.",
  },
  {
    icon: "⚡",
    title: "Instant Verification",
    description: "Verify ownership and document authenticity in seconds\nthrough real-time registry validation.",
  },
  {
    icon: "🏛️",
    title: "Government Certified",
    description: "Records are officially validated by authorized departments\nand aligned with national compliance standards.",
  },
  {
    icon: "🛡️",
    title: "Tamper Proof",
    description: "Unauthorized edits are blocked by design with complete\naudit trails for every registry transaction.",
  },
];

const steps = ["Register property details", "Validate ownership records", "Issue trusted digital certificate"];

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden bg-[#F5F7FB] text-[#0A1628] [font-family:'Poppins',sans-serif]">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="text-3xl leading-none">🏛️</span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-extrabold text-[#0A1628]">LandChain</p>
              <p className="truncate text-xs font-semibold tracking-wide text-[#FF6B00]">भूमि रजिस्ट्री</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link}
                href={`/${link.toLowerCase()}`}
                className="text-sm font-semibold text-[#0A1628] transition hover:text-[#FF6B00]"
              >
                {link}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="flex min-h-screen items-center bg-gradient-to-br from-[#0A1628] to-[#1a2f5e] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-[64px]">
            Secure Land Registry on Blockchain
          </h1>
          <p className="mt-5 text-lg font-semibold text-[#FF6B00] sm:text-2xl">भारत की सुरक्षित भूमि पंजीकरण प्रणाली</p>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            LandChain is a trusted digital platform designed for transparent, immutable, and efficient land record
            management across India with secure blockchain-backed governance.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="w-full rounded-md bg-[#FF6B00] px-8 py-3 text-center text-sm font-bold text-white transition hover:bg-[#e86200] sm:w-auto">
              Register Property
            </Link>
            <Link href="/verify" className="w-full rounded-md border border-white px-8 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto">
              Verify Property
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 p-6 text-center">
              <p className="text-4xl font-extrabold text-[#0A1628]">{item.value}</p>
              <p className="mt-2 text-sm font-medium text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full bg-[#EEF2F7] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="text-center text-3xl font-extrabold text-[#0A1628] sm:text-4xl">Platform Features</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-3xl leading-none">{feature.icon}</p>
                <h3 className="mt-4 text-xl font-bold text-[#0A1628]">{feature.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold text-[#0A1628] sm:text-4xl">How It Works</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center rounded-xl border border-slate-200 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B00] text-lg font-extrabold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-base font-semibold text-[#0A1628]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="w-full bg-[#0A1628] px-4 py-10 text-slate-200 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-3 text-center md:text-left">
          <p className="text-sm leading-7">
            Government of India digital land registry services are provided for lawful use and official verification
            purposes only.
          </p>
          <p className="text-sm leading-7">भारत सरकार की डिजिटल भूमि रजिस्ट्री सेवाएं केवल विधिक उपयोग और आधिकारिक सत्यापन हेतु उपलब्ध हैं।</p>
          <p className="pt-2 text-xs text-slate-400">© 2026 LandChain. Government of India.</p>
        </div>
      </footer>
    </div>
  );
}
