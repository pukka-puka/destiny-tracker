// frontend/web/src/app/page.tsx
'use client';

import Link from 'next/link';
import { Sparkles, Star, Moon, Sun, Heart } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      title: '手相占い',
      description: 'AI画像解析で読み解く運命の線',
      icon: '🤚',
      href: '/palm',
      gradient: 'from-purple-500 to-pink-500',
      color: 'bg-purple-500' // colorプロパティを追加
    },
    {
      title: 'タロット占い',
      description: '78枚のカードが導く神秘のメッセージ',
      icon: '🎴',
      href: '/tarot',
      gradient: 'from-indigo-500 to-purple-500',
      color: 'bg-indigo-500' // colorプロパティを追加
    },
    {
      title: 'AIチャット相談',
      description: '24時間いつでも相談できるAI占い師',
      icon: '💬',
      href: '/chat',
      gradient: 'from-blue-500 to-cyan-500',
      color: 'bg-blue-500' // colorプロパティを追加
    },
    {
      title: '運勢ダッシュボード',
      description: 'あなたの運勢を可視化',
      icon: '📊',
      href: '/dashboard',
      gradient: 'from-green-500 to-emerald-500',
      color: 'bg-green-500' // colorプロパティを追加
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 animate-pulse" />
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Sparkles className="w-20 h-20 text-yellow-400 animate-pulse" />
                <Star className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-spin-slow" />
                <Moon className="w-6 h-6 text-blue-300 absolute -bottom-1 -left-1 animate-bounce" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Shukumei
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              AIが導く、あなただけの運命の羅針盤
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/palm"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all shadow-lg"
              >
                今すぐ占いを始める
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full hover:bg-white/20 transition-all border border-white/30">
                詳しく見る
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 機能カード */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            選べる占い機能
          </h2>
          <p className="text-gray-400">
            最先端のAI技術であなたの運命を解き明かします
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />
              
              <div className="relative z-10">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm">
                  {feature.description}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* 特徴セクション */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">最先端AI技術</h3>
            <p className="text-gray-400">
              Claude AIによる高精度な占い解析
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">パーソナライズ</h3>
            <p className="text-gray-400">
              あなただけの運勢を詳細に分析
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">24時間対応</h3>
            <p className="text-gray-400">
              いつでもどこでも占い相談可能
            </p>
          </div>
        </div>
      </div>

      {/* CTA セクション */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            運命の扉を開きましょう
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            AIの力で、あなたの未来への道筋を照らします。
            今すぐ始めて、新しい自分を発見してください。
          </p>
          <Link
            href="/palm"
            className="inline-block px-8 py-4 bg-white text-purple-600 font-bold rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg"
          >
            無料で占いを始める
          </Link>
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Shukumei. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}