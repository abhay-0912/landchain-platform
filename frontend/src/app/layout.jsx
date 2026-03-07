import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'LandChain - Blockchain Land Registry',
  description: 'Immutable, transparent land registry system powered by blockchain technology. Register, transfer, and verify property ownership securely.',
  keywords: 'land registry, blockchain, property, India, real estate, smart contracts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
