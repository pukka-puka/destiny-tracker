'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Upload, Image as ImageIcon, Loader2, Camera, AlertCircle, Sparkles } from 'lucide-react';

export default function PalmPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`圧縮完了: ${file.size} → ${blob.size} bytes`);
                resolve(blob);
              } else {
                reject(new Error('圧縮に失敗しました'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
      };
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      // 画像を圧縮
      const compressedBlob = await compressImage(file);
      
      // Firebase Storageにアップロード
      const timestamp = Date.now();
      const fileName = `palm-images/${user.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          console.log(`Upload is ${progress}% done`);
          
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          console.error('Upload error:', error);
          setError(`アップロードエラー: ${error.message}`);
          setUploading(false);
        },
        async () => {
          try {
            // アップロード完了後の処理
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', url);

            // Firestoreに記録を保存（analyzing状態）
            const docRef = await addDoc(collection(db, 'palm-readings'), {
              userId: user.uid,
              imageUrl: url,
              createdAt: new Date().toISOString(),
              status: 'analyzing',
              originalFileName: file.name,
              fileSize: compressedBlob.size
            });

            setAnalyzing(true);
            try {
              const analysisResponse = await fetch('/api/analyze-palm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: url,
                  userId: user.uid,
                  readingId: docRef.id
                })
              });

              if (analysisResponse.ok) {
                const data = await analysisResponse.json();
                // Firestoreを更新
                await updateDoc(doc(db, 'palm-readings', docRef.id), {
                  status: 'completed',
                  analysis: data.analysis,
                  analyzedAt: data.analyzedAt
                });
              }
            } catch (error) {
              console.error('API call error:', error);
              // エラー時はモックデータを使用
            }

            setAnalyzing(false);

            // 解析ページへ遷移
            router.push(`/palm/analysis/${docRef.id}`);
          } catch (innerError) {
            console.error('Processing error:', innerError);
            setError('処理中にエラーが発生しました');
            setUploading(false);
            setAnalyzing(false);
          }
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setError('エラーが発生しました。もう一度お試しください。');
      setUploading(false);
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
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">アップロード成功！解析ページへ移動しています...</p>
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
                クリックして選択 または ドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-400 mt-2">
                対応形式: JPG, PNG, GIF (最大10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="手相"
                  className="w-full h-auto max-h-96 object-contain"
                />
                {(uploading || analyzing) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
                    <p className="text-white font-medium">
                      {analyzing ? '手相を解析中...' : `アップロード中... ${uploadProgress}%`}
                    </p>
                    {uploading && (
                      <div className="w-64 bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                    setError(null);
                    setSuccess(false);
                  }}
                  disabled={uploading || analyzing}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  画像を変更
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || analyzing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading || analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {analyzing ? '解析中...' : 'アップロード中...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      占いを開始する
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">📸 撮影のコツ</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• 明るい場所で手のひら全体を撮影してください</li>
              <li>• 指を自然に開いた状態で撮影してください</li>
              <li>• 手相の線がはっきり見えるように撮影してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}