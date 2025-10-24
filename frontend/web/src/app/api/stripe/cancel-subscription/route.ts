// src/app/api/stripe/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Firestoreからサブスクリプション情報を取得
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Stripeでサブスクリプションをキャンセル（期間終了時に）
    const subscription = await stripe.subscriptions.update(
      userData.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Firestoreを更新
    await adminDb.collection('users').doc(userId).update({
      subscriptionCancelAtPeriodEnd: true,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      cancelAt: new Date(subscription.current_period_end * 1000),
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
