// src/lib/storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase';

// Storage インスタンスを取得
const storage = getStorage(app);

// 画像アップロード関数
export const uploadPalmImage = async (
  file: File, 
  userId: string
): Promise<{ url: string; path: string }> => {
  try {
    // ファイル名を生成（ユーザーID + タイムスタンプ）
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}_${file.name}`;
    const filePath = `palm-images/${userId}/${fileName}`;
    
    // Storage参照を作成
    const storageRef = ref(storage, filePath);
    
    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // アップロードしたファイルのURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading palm image:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
};

// 画像削除関数
export const deletePalmImage = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting palm image:', error);
    throw new Error('画像の削除に失敗しました');
  }
};

// ファイルサイズ検証（最大5MB）
export const validateFileSize = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
};

// ファイルタイプ検証
export const validateFileType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
};