'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const userData = user
    ? {
        email: user.email!,
        full_name: user.user_metadata?.full_name,
      }
    : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={userData}
        onLogout={signOut}
        onMenuClick={() => setSidebarOpen(true)}
        showMenuButton={true}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 bg-gray-50">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
