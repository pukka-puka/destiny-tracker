import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const testUsers = [
      {
        uid: 'test-free-user',
        email: 'test-free@example.com',
        displayName: 'テスト太郎（無料）',
        subscription: 'free',
        readingCount: 0,
        palmReadingCount: 0,
        ichingCount: 0,
        chatConsultCount: 0,
        compatibilityCount: 0,
        currentMonth,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: 'test-basic-user',
        email: 'test-basic@example.com',
        displayName: 'テスト花子（ベーシック）',
        subscription: 'basic',
        readingCount: 0,
        palmReadingCount: 0,
        ichingCount: 0,
        chatConsultCount: 0,
        compatibilityCount: 0,
        currentMonth,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: 'test-premium-user',
        email: 'test-premium@example.com',
        displayName: 'テスト次郎（プレミアム）',
        subscription: 'premium',
        readingCount: 0,
        palmReadingCount: 0,
        ichingCount: 0,
        chatConsultCount: 0,
        compatibilityCount: 0,
        currentMonth,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const results = [];
    for (const user of testUsers) {
      await adminDb.collection('users').doc(user.uid).set(user);
      results.push(user);
    }

    return NextResponse.json({ success: true, users: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
