'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { uploadPalmImage, validateFileSize, validateFileType } from '@/lib/storage';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function PalmUploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // エラーリセット
    setError(null);
    setSuccess(false);

    // ファイル検証
    if (!validateFileType(file)) {
      setError('画像形式はJPEG、PNG、WebPのみ対応しています');
      return;
    }

    if (!validateFileSize(file)) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    // プレビュー生成
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setSelectedImage(file);
  }, []);

  // 画像アップロード処理
  const handleUpload = async () => {
    if (!selectedImage || !user) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(20);

    try {
      // Firebase Storageにアップロード
      setUploadProgress(40);
      const { url, path } = await uploadPalmImage(selectedImage, user.uid);
      
      setUploadProgress(60);
      
      // Firestoreにメタデータを保存
      const docRef = await addDoc(collection(db, 'palm-readings'), {
        userId: user.uid,
        imageUrl: url,
        imagePath: path,
        status: 'pending', // 解析待ち
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setUploadProgress(80);
      
      // 成功表示
      setUploadProgress(100);
      setSuccess(true);
      
      // 2秒後に解析結果ページへ遷移
      setTimeout(() => {
        router.push(`/palm/analysis/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // 画像クリア
  const handleClear = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  // 認証チェック
  if (authLoading) {
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">ログインが必要です</p>
          <button
            onClick={() => router.push('/auth')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ログインページへ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🔮 手相をアップロード
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* アップロードエリア */}
          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">手のひらの写真を選択してください</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block transition-colors">
                  画像を選択
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-4">
                JPEG, PNG, WebP形式 / 最大5MB
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* プレビュー */}
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={previewUrl}
                  alt="手相プレビュー"
                  className="w-full h-auto max-h-96 object-contain bg-gray-100"
                />
                {!isUploading && (
                  <button
                    onClick={handleClear}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {/* アップロード進捗 */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>アップロード中...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* エラー表示 */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 成功表示 */}
              {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">アップロード完了！解析ページへ移動します...</p>
                </div>
              )}

              {/* アクションボタン */}
              {!isUploading && !success && (
                <div className="flex gap-4">
                  <button
                    onClick={handleClear}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    アップロード
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 手相撮影のヒント */}
          <div className="mt-8 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">📸 撮影のコツ</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• 明るい場所で撮影してください</li>
              <li>• 手のひら全体が写るようにしてください</li>
              <li>• ピントを合わせて鮮明に撮影してください</li>
              <li>• 影ができないよう注意してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}