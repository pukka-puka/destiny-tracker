'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import UsageLimitModal from '@/components/UsageLimitModal';

export default function PalmPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);

  // 匿名認証の初期化
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          console.log('🔐 匿名認証を開始...');
          const credential = await signInAnonymously(auth);
          console.log('✅ 匿名認証完了:', credential.user.uid);
        } else {
          const user = auth.currentUser;
          console.log('✅ 既にログイン済み:', user.uid);
        }
      } catch (error) {
        console.error('❌ 認証エラー:', error);
        setError('認証に失敗しました。ページをリロードしてください。');
      }
    };
    
    initAuth();
  }, []);

  const convertToJPEG = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            'image/jpeg',
            0.9
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!preview || !user) {
      console.error('❌ preview or user is missing');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress('画像を変換中...');

      console.log('📸 画像変換開始...');
      const base64Response = await fetch(preview);
      const blob = await base64Response.blob();
      const jpegBlob = await convertToJPEG(
        new File([blob], 'palm.jpg', { type: 'image/jpeg' })
      );

      console.log('✅ JPEG変換完了');

      setProgress('画像をアップロード中...');
      const fileName = `palm/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, jpegBlob);
      const imageUrl = await getDownloadURL(storageRef);

      console.log('✅ アップロード完了:', imageUrl);

      setProgress('データを保存中...');
      const docRef = await addDoc(collection(db, 'readings'), {
        userId: user.uid,
        readingType: 'palm',
        status: 'analyzing',
        palmReading: {
          imageUrl,
          analyzedAt: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('💾 Firestoreに保存:', docRef.id);

      setUploading(false);
      setAnalyzing(true);
      setProgress('AI解析中... (30秒〜1分程度かかります)');

      const analysisResponse = await fetch('/api/analyze-palm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          userId: user.uid,
          readingId: docRef.id,
        }),
      });

      // 403エラーのハンドリングを追加
      if (analysisResponse.status === 403) {
        const errorData = await analysisResponse.json();
        setShowLimitModal(true);
        setUploading(false);
        setAnalyzing(false);
        setProgress('');
        return;
      }

      const analysisData = await analysisResponse.json();
      console.log('✅ AI解析完了:', analysisData);

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || 'AI解析に失敗しました');
      }

      setProgress('解析完了！結果ページへ移動します...');

      setTimeout(() => {
        router.push(`/palm/analysis/${docRef.id}`);
      }, 2000);
    } catch (err) {
      console.error('❌ エラー:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setUploading(false);
      setAnalyzing(false);
      setProgress('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            手相占い
            <Sparkles className="w-8 h-8 text-purple-600" />
          </h1>
          <p className="text-gray-600">あなたの手のひらから未来を読み解きます</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">エラー</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {progress && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-blue-800 font-medium">{progress}</p>
              </div>
            </div>
          )}

          {!preview ? (
            <div
              {...getRootProps()}
              className={`border-3 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
                ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
            >
              <input {...getInputProps()} />
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive
                  ? '画像をドロップしてください'
                  : '手のひらの画像をアップロード'}
              </p>
              <p className="text-sm text-gray-500">
                クリックして選択、またはドラッグ&ドロップ
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPreview(null);
                    setProgress('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={uploading || analyzing}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || analyzing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading || analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      解析開始
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 使用制限モーダルを追加 */}
        <UsageLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          featureName="手相占い"
        />
      </div>
    </div>
  );
}
