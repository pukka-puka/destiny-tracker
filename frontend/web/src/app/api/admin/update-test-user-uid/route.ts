import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { oldUid, newUid, email } = await request.json();

    console.log(`🔄 UID更新: ${oldUid} → ${newUid}`);

    // 古いドキュメントを取得
    const oldDoc = await adminDb.collection('users').doc(oldUid).get();
    
    if (!oldDoc.exists) {
      console.log(`❌ ${oldUid} が見つかりません`);
      return NextResponse.json(
        { error: 'Old user not found' },
        { status: 404 }
      );
    }

    const userData = oldDoc.data()!;

    // 新しいUIDでドキュメントを作成
    await adminDb.collection('users').doc(newUid).set({
      ...userData,
      uid: newUid,
      email: email,
      updatedAt: new Date(),
    });

    console.log(`✅ 新しいドキュメント作成: ${newUid}`);

    // 古いドキュメントを削除
    await adminDb.collection('users').doc(oldUid).delete();
    console.log(`🗑️  古いドキュメント削除: ${oldUid}`);

    return NextResponse.json({
      success: true,
      message: `UID updated: ${oldUid} → ${newUid}`,
      user: {
        uid: newUid,
        email: email,
        subscription: userData.subscription,
      }
    });
  } catch (error: any) {
    console.error('❌ エラー:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
