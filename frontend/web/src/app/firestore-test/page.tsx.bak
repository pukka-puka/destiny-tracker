'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export default function FirestoreTestPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    const logs: string[] = [];
    
    try {
      logs.push('🔐 認証状態を確認中...');
      setStatus([...logs]);
      
      let user = auth.currentUser;
      if (!user) {
        logs.push('📝 匿名認証を実行中...');
        setStatus([...logs]);
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;
      }
      
      logs.push(`✅ 認証成功 (UID: ${user.uid})`);
      setStatus([...logs]);
      
      await fetchDocuments();
      
    } catch (error: any) {
      logs.push(`❌ エラー: ${error.message}`);
      setStatus([...logs]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs: any[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const addTestDocument = async () => {
    setLoading(true);
    const logs = [...status];
    
    try {
      logs.push('📤 Firestoreにドキュメントを追加中...');
      setStatus([...logs]);
      
      const docRef = await addDoc(collection(db, 'test'), {
        message: `テストメッセージ ${new Date().toLocaleTimeString()}`,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous'
      });
      
      logs.push(`✅ ドキュメント追加成功! ID: ${docRef.id}`);
      setStatus([...logs]);
      
      await fetchDocuments();
      
    } catch (error: any) {
      logs.push(`❌ Firestoreエラー: ${error.message}`);
      setStatus([...logs]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Firestore テスト</h1>
          
          <div className="mb-6 p-4 bg-gray-100 rounded-lg max-h-60 overflow-y-auto">
            <h2 className="font-semibold mb-2">ステータス:</h2>
            {status.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
          
          <div className="mb-6 space-x-4">
            <button
              onClick={addTestDocument}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '追加中...' : 'テストドキュメントを追加'}
            </button>
            
            <button
              onClick={fetchDocuments}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              再取得
            </button>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">
              ドキュメント ({documents.length}件)
            </h2>
            {documents.length === 0 ? (
              <p className="text-gray-500">まだドキュメントがありません</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">ID: {doc.id}</div>
                    <div className="text-sm">{doc.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
