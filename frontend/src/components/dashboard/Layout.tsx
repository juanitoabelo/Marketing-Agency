import Link from 'next/link';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title: string;
  badges?: { label: string; count?: number }[];
}

const sidebarItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/clients', label: 'Clients & Leads', icon: '👥' },
  { href: '/projects', label: 'Projects', icon: '📁' },
  { href: '/communications', label: 'Communications', icon: '📧' },
  { href: '/seo-analytics', label: 'SEO Analytics', icon: '🔍' },
  { href: '/billing', label: 'Billing', icon: '💰' },
  { href: '/agent-dashboard', label: 'Agent Dashboard', icon: '🤖' },
  { href: '/inter-agent-log', label: 'Inter-Agent Log', icon: '💬' },
  { href: '/autonomous-monitor', label: 'Autonomous Monitor', icon: '🔄' },
  { href: '/security', label: 'Security', icon: '🔒' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children, title, badges }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Abelo Creative</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {badges && (
              <div className="flex gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge.label}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    {badge.label} {badge.count !== undefined && `(${badge.count})`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
