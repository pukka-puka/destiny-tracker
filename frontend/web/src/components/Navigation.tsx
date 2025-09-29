'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoginModal from './auth/LoginModal';
import UserMenu from './auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Activity, User } from 'lucide-react';

export default function Navigation() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-purple-600">
                  Destiny Tracker
                </span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center ml-10 space-x-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  <Home className="w-4 h-4" />
                  ホーム
                </Link>
                
                {user && (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      <Activity className="w-4 h-4" />
                      ダッシュボード
                    </Link>
                    <Link
                      href="/palm"
                      className="flex items-center gap-2 text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      <User className="w-4 h-4" />
                      手相占い
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  ログイン
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {user && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 block px-3 py-2 rounded-md text-base font-medium"
              >
                <Home className="w-4 h-4" />
                ホーム
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 block px-3 py-2 rounded-md text-base font-medium"
              >
                <Activity className="w-4 h-4" />
                ダッシュボード
              </Link>
              <Link
                href="/palm"
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 block px-3 py-2 rounded-md text-base font-medium"
              >
                <User className="w-4 h-4" />
                手相占い
              </Link>
            </div>
          </div>
        )}
      </nav>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
