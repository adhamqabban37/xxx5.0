// Firebase configuration
// For development - this will be a mock configuration
// In production, replace with actual Firebase config

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config - use environment variables or provide defaults for development
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'development-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'xenlix-dev.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'xenlix-dev',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'xenlix-dev.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'development-app-id'
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization failed - using mock configuration for development:', error);
  
  // Create mock Firebase app
  app = {
    name: '[DEFAULT]',
    options: firebaseConfig,
    automaticDataCollectionEnabled: false
  } as FirebaseApp;
  
  // Create a mock firestore for development
  const mockDb = {
    collection: (path: string) => ({
      doc: (id?: string) => ({
        get: () => Promise.resolve({ exists: false, data: () => null }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      }),
      add: () => Promise.resolve({ id: 'mock-doc-id' }),
      where: () => mockDb.collection(path),
      orderBy: () => mockDb.collection(path),
      limit: () => mockDb.collection(path),
      get: () => Promise.resolve({ docs: [], size: 0 }),
    }),
    doc: (path: string) => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    })
  } as any;
  
  db = mockDb;
}

export { db };
export default app;