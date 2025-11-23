'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user?: {
    email: string;
    full_name?: string | null;
  };
  onLogout?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ user, onLogout, onMenuClick, showMenuButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-700 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Logo and Title */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-32 sm:w-48">
              <Image
                src="/logo-sddc.jpg"
                alt="San Diego Diplomacy Council"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-primary-blue">
                San Diego Diplomacy Council
              </h1>
              <p className="text-xs text-gray-500">Proposal Manager</p>
            </div>
          </Link>
        </div>

        {/* User Actions */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                {user.full_name || user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
