import { Shield, Code2, Scale, Globe, Users, Cpu } from 'lucide-react';

const techStack = [
  { name: 'Next.js 14', desc: 'React framework with App Router', icon: Code2, color: 'bg-black text-white' },
  { name: 'Solidity', desc: 'Smart contracts on Ethereum', icon: Cpu, color: 'bg-blue-600 text-white' },
  { name: 'IPFS / Pinata', desc: 'Decentralised document storage', icon: Globe, color: 'bg-teal-600 text-white' },
  { name: 'Node.js / Express', desc: 'Backend REST API', icon: Code2, color: 'bg-accent-600 text-white' },
  { name: 'MongoDB', desc: 'Off-chain data persistence', icon: Cpu, color: 'bg-orange-600 text-white' },
  { name: 'Tailwind CSS', desc: 'Utility-first styling', icon: Code2, color: 'bg-cyan-600 text-white' },
];

const team = [
  { name: 'Ministry of Land Affairs', role: 'Regulatory Partner' },
  { name: 'National Informatics Centre', role: 'Technology Partner' },
  { name: 'State Revenue Departments', role: 'Implementation Partner' },
];

export const metadata = {
  title: 'About LandChain',
  description: 'Learn about the LandChain platform, its purpose, and the technology behind it.',
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-950 to-primary-800 py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 mb-6">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">About LandChain</h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            A blockchain-powered land registry system designed to bring transparency,
            security, and accessibility to property records across India.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Land fraud costs Indian citizens billions of rupees every year. Forged documents,
              duplicate registrations, and opaque processes fuel disputes that drag on for decades.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              LandChain solves this by recording every property transaction on the Ethereum
              blockchain — creating an immutable, publicly auditable chain of custody that no
              single authority can alter.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our platform connects citizens, government officers, banks, and legal professionals
              in a single, role-based ecosystem built for trust.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: 'Fraud-proof records', color: 'bg-primary-50 text-primary-700' },
              { icon: Globe, label: 'Nationally accessible', color: 'bg-accent-50 text-accent-700' },
              { icon: Users, label: 'Multi-stakeholder', color: 'bg-blue-50 text-blue-700' },
              { icon: Scale, label: 'Legally compliant', color: 'bg-orange-50 text-orange-700' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="rounded-2xl bg-gray-50 border border-gray-100 p-6 flex flex-col items-center gap-3 text-center">
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon size={22} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Technology Stack</h2>
            <p className="text-gray-600">Built with industry-leading open-source technology</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech) => {
              const Icon = tech.icon;
              return (
                <div key={tech.name} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-3 text-center hover:shadow-card-md transition-shadow">
                  <div className={`p-2 rounded-lg ${tech.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tech.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tech.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legal Framework */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Legal Framework</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              LandChain is designed in compliance with:
            </p>
            <ul className="space-y-3">
              {[
                'Registration Act, 1908',
                'Transfer of Property Act, 1882',
                'Information Technology Act, 2000',
                'National Land Records Modernisation Programme (NLRMP)',
                'RERA (Real Estate Regulation and Development Act, 2016)',
              ].map((law) => (
                <li key={law} className="flex items-start gap-3 text-sm text-gray-700">
                  <Scale size={16} className="text-primary-600 mt-0.5 shrink-0" />
                  {law}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Partners</h2>
            <div className="space-y-4">
              {team.map((t) => (
                <div key={t.name} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
