import Link from 'next/link';
import {
  Shield, ArrowRight, CheckCircle, Lock, Zap,
  Users, FileText, BarChart3, Globe, Search,
  ChevronRight, Star
} from 'lucide-react';

const steps = [
  { icon: FileText, title: 'Register Property', desc: 'Submit property details and documents. Our system validates and stores them on-chain.', color: 'bg-primary-100 text-primary-700' },
  { icon: Search, title: 'Verify Ownership', desc: 'Government officers verify documents and approve registrations with digital signatures.', color: 'bg-blue-100 text-blue-700' },
  { icon: ArrowRight, title: 'Transfer Securely', desc: 'Execute tamper-proof transfers via smart contracts with multi-party consent.', color: 'bg-purple-100 text-purple-700' },
  { icon: Shield, title: 'Immutable Record', desc: 'Every transaction is recorded on the Ethereum blockchain — permanent and auditable.', color: 'bg-accent-100 text-accent-700' },
];

const features = [
  { icon: Lock, title: 'Immutable Records', desc: 'Once recorded on the blockchain, property records cannot be altered or tampered with.', color: 'text-primary-600 bg-primary-50' },
  { icon: Zap, title: 'Instant Verification', desc: 'Verify property ownership and history in seconds using the public blockchain explorer.', color: 'text-accent-600 bg-accent-50' },
  { icon: Shield, title: 'Smart Contracts', desc: 'Automated transfers and escrow via audited smart contracts eliminate middlemen.', color: 'text-blue-600 bg-blue-50' },
  { icon: Users, title: 'Role-Based Access', desc: 'Citizens, officers, banks, and admins each have tailored dashboards and permissions.', color: 'text-purple-600 bg-purple-50' },
  { icon: FileText, title: 'Document Vault', desc: 'IPFS-backed decentralised storage for all land documents with permanent links.', color: 'text-orange-600 bg-orange-50' },
  { icon: BarChart3, title: 'Transparent History', desc: 'Full chronological ownership history visible to all stakeholders at any time.', color: 'text-rose-600 bg-rose-50' },
];

const stats = [
  { value: '10K+', label: 'Properties Registered' },
  { value: '50K+', label: 'Transactions Processed' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '0', label: 'Fraudulent Records' },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* ─── Hero ──────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
              Now live on Ethereum Mainnet
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Land Registry
              <br />
              <span className="text-accent-400">Reimagined</span> with
              <br />Blockchain
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-2xl">
              LandChain brings trust, transparency, and tamper-proof permanence to property records.
              Register, verify, and transfer land ownership — all on-chain.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-primary-500 hover:bg-primary-400 text-white transition-colors shadow-lg"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              >
                Learn More
                <ChevronRight size={18} />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center gap-6">
              {['Ethereum Secured', 'IPFS Storage', 'Open Source', 'ISO Compliant'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-white/60 text-xs font-medium">
                  <CheckCircle size={14} className="text-accent-400" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative blob */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute right-20 top-20 w-72 h-72 rounded-full bg-primary-500 blur-3xl" />
          <div className="absolute right-40 bottom-20 w-56 h-56 rounded-full bg-accent-500 blur-3xl" />
        </div>
      </section>

      {/* ─── Stats ────────────────────────────── */}
      <section className="bg-primary-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center px-6 py-2">
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">How LandChain Works</h2>
            <p className="section-subtitle mx-auto mt-3">
              Four simple steps to secure your property on the blockchain
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-md transition-shadow">
                  <div className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${step.color}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle mx-auto mt-3">
              A complete land registry ecosystem trusted by citizens, government, and financial institutions
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-card transition-all">
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${feat.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Globe size={40} className="text-primary-200 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to secure your property?
          </h2>
          <p className="text-primary-200 mb-8">
            Join thousands of citizens using LandChain for tamper-proof land records.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-3 rounded-xl font-semibold text-sm bg-white text-primary-700 hover:bg-primary-50 transition-colors shadow-md"
            >
              Create Account
            </Link>
            <Link
              href="/search"
              className="px-8 py-3 rounded-xl font-semibold text-sm bg-primary-500 hover:bg-primary-400 text-white border border-primary-400 transition-colors"
            >
              Search Properties
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
