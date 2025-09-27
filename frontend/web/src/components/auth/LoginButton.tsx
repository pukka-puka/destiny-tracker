// src/components/auth/LoginButton.tsx

'use client';

import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from './LoginModal';

export const LoginButton: React.FC = () => {
  // signOutを正しく取得
  const authContext = useAuth();
  const { user } = authContext;
  const [showModal, setShowModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await authContext.signOut();
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        ログアウト
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
      >
        <LogIn className="w-4 h-4" />
        <span>ログイン</span>
      </button>
      
      <LoginModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};