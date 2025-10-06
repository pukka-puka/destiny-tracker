'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth/firebase-auth';
import { User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
      >
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
        )}
        <span className="hidden md:block text-sm font-medium">
          {userProfile?.displayName || user.email}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium">
                {userProfile?.displayName || 'ユーザー'}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            
            <button
              onClick={() => {
                router.push('/profile');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 transition"
            >
              <Settings className="w-4 h-4" />
              プロフィール設定
            </button>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 transition text-red-600"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
