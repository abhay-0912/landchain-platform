import {
  UserPlus, FilePlus, UserCheck, Stamp, ArrowRightLeft,
  Link2, CheckCircle2, ChevronRight
} from 'lucide-react';

export const metadata = {
  title: 'How It Works - LandChain',
  description: 'Step-by-step guide to registering and transferring property on LandChain.',
};

const phases = [
  {
    phase: 'Phase 1: Onboarding',
    color: 'primary',
    steps: [
      {
        icon: UserPlus,
        title: 'Create Your Account',
        desc: 'Register as a citizen using your email, phone, and Government ID. Complete KYC by uploading Aadhaar, PAN, and address proof documents.',
        detail: 'The system verifies your identity documents through our secure validation pipeline before activating your account.',
      },
      {
        icon: UserCheck,
        title: 'KYC Verification',
        desc: 'A government officer reviews your KYC documents and approves your identity. This ensures only verified citizens can register properties.',
        detail: 'KYC typically takes 1-2 business days. You receive a notification once approved.',
      },
    ],
  },
  {
    phase: 'Phase 2: Property Registration',
    color: 'blue',
    steps: [
      {
        icon: FilePlus,
        title: 'Submit Property Details',
        desc: 'Enter your survey number, property coordinates (lat/lng), area, city, and state. Upload the title deed, encumbrance certificate, and other supporting documents.',
        detail: 'Documents are stored on IPFS (InterPlanetary File System) — a decentralised storage network that guarantees permanent, tamper-proof access.',
      },
      {
        icon: Stamp,
        title: 'Officer Review & Approval',
        desc: 'A designated revenue officer reviews your submission against physical records. They can approve, reject, or request clarification.',
        detail: 'The officer\'s digital signature is recorded on-chain alongside the approval timestamp.',
      },
      {
        icon: Link2,
        title: 'Blockchain Recording',
        desc: 'Upon approval, your property is minted as a record on the Ethereum blockchain via the PropertyRegistry smart contract.',
        detail: 'The transaction hash serves as permanent proof of registration, visible to anyone with the property ID.',
      },
    ],
  },
  {
    phase: 'Phase 3: Ownership Transfer',
    color: 'accent',
    steps: [
      {
        icon: ArrowRightLeft,
        title: 'Initiate Transfer',
        desc: 'The current owner initiates a transfer by entering the property ID, buyer\'s wallet address, and agreed sale amount.',
        detail: 'Both parties must digitally consent before the smart contract executes the transfer.',
      },
      {
        icon: CheckCircle2,
        title: 'Multi-Party Approval',
        desc: 'The buyer confirms acceptance. A government officer validates the transfer documents and authorises the transaction.',
        detail: 'If a mortgage exists, the lending bank must also provide a no-objection confirmation.',
      },
      {
        icon: Link2,
        title: 'On-Chain Settlement',
        desc: 'The TransferRegistry smart contract atomically updates ownership — the old owner\'s claim is revoked and the new owner\'s is registered in the same transaction.',
        detail: 'The full ownership history is preserved and publicly auditable forever.',
      },
    ],
  },
];

const colorMap = {
  primary: {
    badge: 'bg-primary-100 text-primary-700',
    dot: 'bg-primary-600',
    icon: 'bg-primary-50 text-primary-700',
    line: 'bg-primary-200',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-600',
    icon: 'bg-blue-50 text-blue-700',
    line: 'bg-blue-200',
  },
  accent: {
    badge: 'bg-accent-100 text-accent-700',
    dot: 'bg-accent-600',
    icon: 'bg-accent-50 text-accent-700',
    line: 'bg-accent-200',
  },
};

export default function HowItWorksPage() {
  let stepNum = 0;
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold text-white mb-4">How LandChain Works</h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            From account creation to blockchain-recorded ownership — a complete walkthrough.
          </p>
        </div>
      </section>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
        {phases.map((phase) => {
          const c = colorMap[phase.color];
          return (
            <div key={phase.phase}>
              <div className={`inline-flex px-4 py-1.5 rounded-full text-sm font-semibold mb-8 ${c.badge}`}>
                {phase.phase}
              </div>
              <div className="space-y-6">
                {phase.steps.map((step) => {
                  stepNum++;
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-6">
                      {/* Number + line */}
                      <div className="flex flex-col items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md ${c.dot}`}>
                          {stepNum}
                        </div>
                        <div className={`w-0.5 flex-1 mt-2 ${c.line}`} />
                      </div>

                      {/* Content */}
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-6 flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <div className={`p-2.5 rounded-xl ${c.icon}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{step.title}</h3>
                            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                        <div className="mt-4 pl-4 border-l-2 border-gray-300">
                          <p className="text-xs text-gray-500 italic leading-relaxed">{step.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Final note */}
        <div className="bg-primary-50 rounded-2xl border border-primary-200 p-8 text-center">
          <CheckCircle2 size={40} className="text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">End-to-End Immutability</h3>
          <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto">
            Every action — registration, approval, transfer, mortgage — is tied to a blockchain
            transaction. The complete audit trail is publicly accessible, making fraud virtually
            impossible.
          </p>
        </div>
      </div>
    </div>
  );
}
