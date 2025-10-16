'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function PalmPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 画像をJPEGに変換する関数
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
    if (!preview || !user) return;

    try {
      setUploading(true);
      setError(null);

      // Base64からBlobに変換
      const base64Response = await fetch(preview);
      const blob = await base64Response.blob();

      // JPEGに変換
      console.log('🔄 画像をJPEGに変換中...');
      const jpegBlob = await convertToJPEG(
        new File([blob], 'palm.jpg', { type: 'image/jpeg' })
      );

      // Firebase Storageにアップロード
      console.log('📤 Firebase Storageにアップロード中...');
      const fileName = `palm/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, jpegBlob);
      const imageUrl = await getDownloadURL(storageRef);

      console.log('✅ アップロード完了:', imageUrl);

      // Firestoreに初期データを保存
      console.log('💾 Firestoreに初期データを保存中...');
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

      console.log('✅ Firestore保存完了:', docRef.id);

      setUploading(false);
      setAnalyzing(true);

      // AI解析APIを呼び出し
      console.log('🤖 AI解析を開始...');
      const analysisResponse = await fetch('/api/palm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingId: docRef.id,
          imageUrl,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('AI解析に失敗しました');
      }

      console.log('✅ AI解析完了');
      setSuccess(true);

      // 結果ページへリダイレクト
      setTimeout(() => {
        router.push(`/palm/analysis/${docRef.id}`);
      }, 1000);
    } catch (err) {
      console.error('❌ エラー:', err);
      setError(
        err instanceof Error ? err.message : 'エラーが発生しました'
      );
      setUploading(false);
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ホームへ戻る
          </button>
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
          <p className="text-gray-600">
            あなたの手のひらから未来を読み解きます
          </p>
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

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ 解析完了！</p>
              <p className="text-green-600 text-sm">
                結果ページへ移動しています...
              </p>
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
                  onClick={() => setPreview(null)}
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
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      アップロード中...
                    </>
                  ) : analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      解析中...
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
      </div>
    </div>
  );
}
