// 環境変数を最初に読み込む
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { adminDb } from '../lib/firebase-admin';

async function initializeAllUsers() {
  try {
    console.log('Starting user stats initialization...\n');
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    
    const usersSnapshot = await adminDb.collection('users').get();
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let initialized = 0;
    let skipped = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (userData.readingCount !== undefined) {
        console.log(`Skipped: ${userDoc.id}`);
        skipped++;
        continue;
      }

      await userDoc.ref.update({
        readingCount: 0,
        palmReadingCount: 0,
        chatConsultCount: 0,
        compatibilityCount: 0,
        currentMonth: thisMonth,
        lastReadingAt: null,
      });

      console.log(`Initialized: ${userDoc.id}`);
      initialized++;
    }

    console.log(`\nComplete! Initialized: ${initialized}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initializeAllUsers();
