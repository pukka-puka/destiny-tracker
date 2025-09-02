// src/lib/storage.ts
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot 
} from 'firebase/storage';
import { storage } from './firebase';

// 画像圧縮関数
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // アスペクト比を保ちながらリサイズ
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('画像の圧縮に失敗しました'));
            }
          },
          file.type,
          quality
        );
      };
    };
  });
};

// 進捗表示付き画像アップロード関数
export const uploadPalmImageWithProgress = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void,
  shouldCompress: boolean = true
): Promise<{ url: string; path: string }> => {
  try {
    // 画像を圧縮（オプション）
    let uploadFile: Blob | File = file;
    if (shouldCompress && file.type.startsWith('image/')) {
      uploadFile = await compressImage(file);
      console.log(`圧縮完了: ${file.size} → ${uploadFile.size} bytes`);
    }

    // ファイル名を生成（ユーザーID + タイムスタンプ）
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}_${file.name}`;
    const filePath = `palm-images/${userId}/${fileName}`;
    
    // Storage参照を作成
    const storageRef = ref(storage, filePath);
    
    // アップロードタスクを作成
    const uploadTask = uploadBytesResumable(storageRef, uploadFile, {
      contentType: file.type,
      customMetadata: {
        userId: userId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        compressed: shouldCompress ? 'true' : 'false'
      }
    });

    // Promise でラップして進捗を監視
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // 進捗計算
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
          
          // 進捗コールバック呼び出し
          if (onProgress) {
            onProgress(Math.round(progress));
          }

          // 状態に応じたログ
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
          // エラーハンドリング
          console.error('Upload error:', error);
          let errorMessage = '画像のアップロードに失敗しました';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'アップロード権限がありません';
              break;
            case 'storage/canceled':
              errorMessage = 'アップロードがキャンセルされました';
              break;
            case 'storage/unknown':
              errorMessage = '不明なエラーが発生しました';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        async () => {
          // アップロード完了
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              path: filePath
            });
          } catch (error) {
            reject(new Error('URLの取得に失敗しました'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadPalmImageWithProgress:', error);
    throw new Error('画像のアップロード処理に失敗しました');
  }
};

// 通常の画像アップロード（互換性のため残す）
export const uploadPalmImage = async (
  file: File,
  userId: string
): Promise<{ url: string; path: string }> => {
  return uploadPalmImageWithProgress(file, userId);
};

// 画像削除関数
export const deletePalmImage = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log('画像を削除しました:', filePath);
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

// ファイル検証メッセージ取得
export const getFileValidationMessage = (file: File): string | null => {
  if (!validateFileType(file)) {
    return 'JPEG、PNG、WebP形式の画像をアップロードしてください';
  }
  if (!validateFileSize(file)) {
    return 'ファイルサイズは5MB以下にしてください';
  }
  return null;
};