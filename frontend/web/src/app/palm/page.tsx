// src/app/palm/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  uploadPalmImageWithProgress, 
  validateFileSize, 
  validateFileType,
  getFileValidationMessage 
} from '@/lib/storage';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Camera, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ImageIcon,
  Info,
  Sparkles
} from 'lucide-react';

export default function PalmUploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ドラッグ&ドロップハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  // ファイル処理
  const processFile = (file: File) => {
    // エラーリセット
    setError(null);
    setSuccess(false);

    // ファイル検証
    const validationMessage = getFileValidationMessage(file);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    // プレビュー生成
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setSelectedImage(file);
  };

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  // 画像削除
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  // 画像アップロード処理
  const handleUpload = async () => {
    if (!selectedImage) {
      setError('画像を選択してください');
      return;
    }

    if (!user) {
      setError('ログインが必要です');
      // ログインページへリダイレクト
      router.push('/auth/login?redirect=/palm');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Firebase Storageにアップロード（進捗表示付き）
      const { url, path } = await uploadPalmImageWithProgress(
        selectedImage,
        user.uid,
        (progress) => setUploadProgress(progress),
        true // 圧縮を有効化
      );
      
      // Firestoreにメタデータを保存
      const docRef = await addDoc(collection(db, 'palm-readings'), {
        userId: user.uid,
        userEmail: user.email,
        imageUrl: url,
        imagePath: path,
        fileName: selectedImage.name,
        fileSize: selectedImage.size,
        status: 'pending', // 解析待ち
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 成功表示
      setSuccess(true);
      
      // 2秒後に解析結果ページへ遷移
      setTimeout(() => {
        router.push(`/palm/analysis/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  // ローディング中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              手相占い
            </h1>
            <Sparkles className="w-8 h-8 text-pink-600 ml-2" />
          </div>
          <p className="text-gray-600">
            あなたの手のひらから未来を読み解きます
          </p>
        </div>

        {/* 説明カード */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">撮影のコツ</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>明るい場所で手のひら全体を撮影してください</li>
                <li>指を自然に開いた状態で撮影してください</li>
                <li>手相の線がはっきり見えるように撮影してください</li>
              </ul>
            </div>
          </div>
        </div>

        {/* アップロードエリア */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!previewUrl ? (
            <div
              className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">
                画像をドラッグ&ドロップ
              </p>
              <p className="text-gray-400 text-sm mb-4">
                または
              </p>
              
              <div className="flex justify-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                    <Upload className="w-5 h-5" />
                    <span>ファイルを選択</span>
                  </div>
                </label>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all">
                    <Camera className="w-5 h-5" />
                    <span>カメラで撮影</span>
                  </div>
                </label>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                対応形式: JPEG, PNG, WebP (最大5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* プレビュー */}
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={previewUrl}
                  alt="手相プレビュー"
                  className="w-full h-auto max-h-96 object-contain"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ファイル情報 */}
              {selectedImage && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {selectedImage.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 進捗バー */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>アップロード中...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* 成功メッセージ */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    アップロード完了！解析ページへ移動します...
                  </p>
                </div>
              )}

              {/* アップロードボタン */}
              <button
                onClick={handleUpload}
                disabled={isUploading || success}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isUploading || success
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>アップロード中...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>完了しました</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>占いを開始する</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>アップロードされた画像は占い解析にのみ使用されます</p>
          <p>プライバシーポリシーに基づいて適切に管理されます</p>
        </div>
      </div>
    </div>
  );
}