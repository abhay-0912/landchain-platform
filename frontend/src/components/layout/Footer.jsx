import Link from 'next/link';
import { Shield, Github, Twitter, Mail } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Home', href: '/' },
    { label: 'Search Properties', href: '/search' },
    { label: 'Land Map', href: '/map' },
    { label: 'How It Works', href: '/how-it-works' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
  Support: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Documentation', href: '/docs' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-primary-600 rounded-lg">
                <Shield size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Land<span className="text-primary-400">Chain</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Blockchain-powered land registry system ensuring transparent, tamper-proof property records for all citizens.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                <Github size={18} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4 text-sm">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} LandChain. All rights reserved. Built on Ethereum.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-400 animate-pulse" />
            <span className="text-xs text-gray-500">Blockchain Synced</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
