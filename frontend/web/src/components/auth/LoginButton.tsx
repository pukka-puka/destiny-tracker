'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';
import LoginModal from './LoginModal';

export function LoginButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  if (user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
      >
        <LogIn className="w-4 h-4" />
        ログイン
      </button>
      
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
