import admin from 'firebase-admin';

export const initializeFirebase = (): void => {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.warn('⚠️  Firebase credentials not configured - Google Login will not work');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
};

export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
  return await admin.auth().verifyIdToken(token);
};
