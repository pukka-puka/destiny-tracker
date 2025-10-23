// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log('Webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  console.log('Checkout completed for user:', userId);

  // サブスクリプション情報を取得
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await updateUserSubscription(userId, subscription);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  console.log('Subscription updated for user:', userId);
  await updateUserSubscription(userId, subscription);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  console.log('Subscription cancelled for user:', userId);

  // ユーザーを無料プランに戻す
  await adminDb.collection('users').doc(userId).update({
    subscription: 'free',
    stripeSubscriptionId: null,
    stripeCustomerId: subscription.customer,
    subscriptionStatus: 'cancelled',
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  // 支払い履歴を記録
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      await adminDb.collection('payments').add({
        userId,
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // セントから円に変換
        currency: invoice.currency,
        status: 'succeeded',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  // 支払い失敗を記録
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      await adminDb.collection('payments').add({
        userId,
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'failed',
        failureReason: invoice.status,
        createdAt: FieldValue.serverTimestamp(),
      });

      // ユーザーに通知を送る（実装は別途）
      // await sendPaymentFailedNotification(userId);
    }
  }
}

async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  // プランIDからtierを判定
  const priceId = subscription.items.data[0].price.id;
  let tier: 'basic' | 'premium' = 'basic';

  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
    tier = 'premium';
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
    tier = 'basic';
  }

  await adminDb.collection('users').doc(userId).update({
    subscription: tier,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`User ${userId} subscription updated to ${tier}`);
}
