// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Sparkles, 
  User,
  Bot,
  Loader2,
  MessageCircle,
  Settings
} from 'lucide-react';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UsageLimitModal from '@/components/UsageLimitModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Character {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
}

const characters: Character[] = [
  {
    id: 'fortune_teller',
    name: '占い師ルナ',
    icon: '🔮',
    description: '神秘的で優しい占い師。運命と未来について深い洞察を提供します。',
    systemPrompt: 'あなたは神秘的で優しい占い師「ルナ」です。相談者の悩みに寄り添い、タロット、占星術、手相など様々な占術の知識を活かして、具体的で前向きなアドバイスを提供します。神秘的な雰囲気を保ちながらも、相談者に希望と勇気を与える言葉を選んでください。'
  },
  {
    id: 'counselor',
    name: 'カウンセラー明日香',
    icon: '💫',
    description: '心理カウンセラー。心の悩みに寄り添い、実践的な解決策を提案します。',
    systemPrompt: 'あなたは経験豊富な心理カウンセラー「明日香」です。相談者の話を丁寧に聞き、心理学の知識を活かして、実践的で具体的なアドバイスを提供します。共感的で温かい口調で、相談者が自分自身の答えを見つけられるようサポートしてください。'
  },
  {
    id: 'life_coach',
    name: 'ライフコーチ翔',
    icon: '⭐',
    description: '人生の目標達成をサポート。前向きで行動的なアドバイスが特徴です。',
    systemPrompt: 'あなたは情熱的なライフコーチ「翔」です。相談者の目標達成を全力でサポートし、具体的な行動計画を一緒に考えます。前向きでエネルギッシュな口調で、相談者のモチベーションを高め、一歩踏み出す勇気を与えてください。'
  }
];

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    
    // 新しいセッションIDを生成
    setSessionId(`${user.uid}_${Date.now()}`);
    
    // ウェルカムメッセージ
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `こんにちは、${selectedCharacter.name}です。${selectedCharacter.description}\n\nどんなことでもお気軽にご相談ください。あなたの悩みや質問をお聞かせください。`,
      timestamp: new Date()
    }]);
  }, [user, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const changeCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterSelect(false);
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `こんにちは、${character.name}です。${character.description}\n\nどんなことでもお気軽にご相談ください。`,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInputMessage = inputMessage; // 入力メッセージを保存
    setInputMessage('');
    setIsLoading(true);

    try {
      // Firestoreにメッセージを保存
      await addDoc(collection(db, 'chatMessages'), {
        userId: user.uid,
        sessionId,
        characterId: selectedCharacter.id,
        role: 'user',
        content: currentInputMessage,
        timestamp: Timestamp.now()
      });

      // Claude APIを呼び出し
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          newMessage: currentInputMessage,
          characterPrompt: selectedCharacter.systemPrompt,
          userId: user.uid  // ← この行を追加
        })
      });

      // 403エラーのハンドリングを追加
      if (response.status === 403) {
        const errorData = await response.json();
        setShowLimitModal(true);
        setIsLoading(false);
        // ユーザーメッセージを削除（送信できなかったので）
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        setInputMessage(currentInputMessage); // 入力を復元
        return;
      }

      if (!response.ok) {
        throw new Error('メッセージ送信に失敗しました');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // アシスタントの返答も保存
      await addDoc(collection(db, 'chatMessages'), {
        userId: user.uid,
        sessionId,
        characterId: selectedCharacter.id,
        role: 'assistant',
        content: data.response,
        timestamp: Timestamp.now()
      });

    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* ヘッダー */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/80 hover:text-white"
          >
            ← ダッシュボード
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-3xl">{selectedCharacter.icon}</div>
            <div>
              <h2 className="text-white font-bold">{selectedCharacter.name}</h2>
              <p className="text-white/60 text-sm">オンライン</p>
            </div>
          </div>

          <button
            onClick={() => setShowCharacterSelect(!showCharacterSelect)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* キャラクター選択モーダル */}
      {showCharacterSelect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">相談相手を選択</h3>
            
            <div className="space-y-4">
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => changeCharacter(char)}
                  className={`w-full p-6 rounded-xl text-left transition ${
                    selectedCharacter.id === char.id
                      ? 'bg-white/20 border-2 border-purple-400'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{char.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg mb-1">{char.name}</h4>
                      <p className="text-white/70 text-sm">{char.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCharacterSelect(false)}
              className="mt-6 w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-180px)] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{selectedCharacter.icon}</span>
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 backdrop-blur-xl text-white'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className="text-xs mt-2 opacity-60">
                  {message.timestamp.toLocaleTimeString('ja-JP', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xl">{selectedCharacter.icon}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力... (Shift+Enterで改行)"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 使用制限モーダルを追加 */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName="AIチャット"
      />
    </div>
  );
}