// デバッグ用の追加コード（destiny.service.tsの createReading メソッドを修正）

createReading: async (reading: Partial<DestinyReading>): Promise<string> => {
  try {
    const now = new Date();
    
    // デバッグ：送信データを確認
    console.log('📝 Creating reading with data:', {
      userId: reading.userId,
      readingType: reading.readingType,
      hasParameters: !!reading.parameters,
      hasTarotReading: !!reading.tarotReading,
      timestamp: now.toISOString()
    });
    
    const docRef = await addDoc(collection(db, 'readings'), {
      ...reading,
      readingType: reading.readingType || 'daily-tarot',
      createdAt: Timestamp.fromDate(reading.createdAt || now),
      updatedAt: Timestamp.fromDate(reading.updatedAt || now)
    });
    
    console.log('✅ Reading saved successfully with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creating reading:', error);
    // エラーの詳細を表示
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}
