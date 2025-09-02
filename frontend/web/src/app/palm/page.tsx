'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { uploadPalmImage, validateFileSize, validateFileType } from '@/lib/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PalmUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!validateFileType(file)) {
      setError('画像形式はJPEG、PNG、WebPのみ対応しています');
      return;
    }

    if (!validateFileSize(file)) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setSelectedImage(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedImage || !user) return;

    setIsUploading(true);
    setError(null);

    try {
      const { url, path } = await uploadPalmImage(selectedImage, user.uid);
      
      const docRef = await addDoc(collection(db, 'palm-readings'), {
        userId: user.uid,
        imageUrl: url,
        imagePath: path,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      router.push(`/palm/analysis/${docRef.id}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>ログインが必要です</p>
        <button onClick={() => router.push('/auth')}>
          ログインページへ
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>手相をアップロード</h1>
      <p>ログイン中: {user.email}</p>

      {!previewUrl ? (
        <div style={{ 
          border: '2px dashed #ccc', 
          padding: '40px', 
          textAlign: 'center',
          borderRadius: '8px'
        }}>
          <p>手のひらの写真を選択してください</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginTop: '10px' }}
          />
        </div>
      ) : (
        <div>
          <img 
            src={previewUrl} 
            alt="手相プレビュー" 
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          
          {error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              {error}
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginRight: '10px',
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              {isUploading ? 'アップロード中...' : 'アップロード'}
            </button>
            
            <button 
              onClick={() => {
                setSelectedImage(null);
                setPreviewUrl(null);
                setError(null);
              }}
              disabled={isUploading}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#ccc',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
