'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 画像をJPEG形式に変換する関数
async function convertToJPEG(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // 画像サイズを適切にリサイズ（最大1024px）
      let width = img.width;
      let height = img.height;
      const maxSize = 1024;

      if (width > height && width > maxSize) {
        height = (height / width) * maxSize;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width / height) * maxSize;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // 白背景を追加（透明度対策）
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }

      // JPEGに変換（品質90%）
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('画像の変換に失敗しました'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
  });
}

export default function PalmReadingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!preview || !user) return;

    setUploading(true);
    setError(null);

    try {
      // Base64をBlobに変換
      const base64Data = preview.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const originalBlob = new Blob([byteArray]);

      // Fileオブジェクトに変換
      const file = new File([originalBlob], 'palm.jpg', { type: 'image/jpeg' });

      console.log('📸 画像変換開始...');
      
      // JPEG形式に変換（メタデータ削除）
      const jpegBlob = await convertToJPEG(file);
      
      console.log('✅ JPEG変換完了:', {
        originalSize: file.size,
        convertedSize: jpegBlob.size,
        type: jpegBlob.type,
      });

      // Firebase Storageにアップロード
      const fileName = `palm/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);

      console.log('📤 Firebase Storageにアップロード中...');
      const snapshot = await uploadBytes(storageRef, jpegBlob, {
        contentType: 'image/jpeg',
      });

      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ アップロード完了:', downloadURL);

      setUploading(false);
      setAnalyzing(true);

      // Firestoreに保存
      const docRef = await addDoc(collection(db, 'palmReadings'), {
        userId: user.uid,
        imageUrl: downloadURL,
        status: 'analyzing',
        createdAt: serverTimestamp(),
      });

      console.log('💾 Firestoreに保存:', docRef.id);

      // APIで手相解析
      console.log('🤖 AI解析開始...');
      
      try {
        const response = await fetch('/api/analyze-palm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: downloadURL,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'AI解析に失敗しました');
        }

        const data = await response.json();
        console.log('✅ AI解析完了:', data);

        setSuccess(true);
        setAnalyzing(false);

        // 解析結果ページへ遷移
        setTimeout(() => {
          router.push(`/palm/analysis/${docRef.id}`);
        }, 1000);

      } catch (apiError) {
        console.error('❌ API呼び出しエラー:', apiError);
        setError(apiError instanceof Error ? apiError.message : 'AI解析に失敗しました');
        setAnalyzing(false);
      }

    } catch (uploadError) {
      console.error('❌ アップロードエラー:', uploadError);
      setError('画像のアップロードに失敗しました');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
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
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">エラーが発生しました</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ 解析完了！</p>
              <p className="text-green-600 text-sm mt-1">結果ページへ移動しています...</p>
            </div>
          )}

          {!preview ? (
            <div
              {...getRootProps()}
              className={`border-3 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
                ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}`}
            >
              <input {...getInputProps()} />
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? '画像をドロップしてください' : '手のひらの写真をアップロード'}
              </p>
              <p className="text-sm text-gray-500">
                クリックまたはドラッグ&ドロップで画像を選択
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPEG, PNG, HEIC形式に対応
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={preview}
                  alt="プレビュー"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPreview(null);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  disabled={uploading || analyzing}
                >
                  別の画像を選択
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || analyzing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      アップロード中...
                    </>
                  ) : analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI解析中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      解析開始
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 撮影のコツ */}
          <div className="mt-8 p-6 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              より正確な鑑定のために
            </h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                明るい場所で撮影してください
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                手のひら全体がはっきり写るように
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                指を軽く開いて、線がよく見えるように
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                利き手で撮影することをおすすめします
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}