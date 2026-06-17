import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Detect if we are using the placeholder credentials
export const isOfflineDemo = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.startsWith('mock-') || 
  firebaseConfig.projectId.startsWith('mock-');

let app;
let authInstance: any = null;
let dbInstance: any = null;

if (!isOfflineDemo) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    dbInstance = dbId && dbId !== '(default)' && dbId.trim() !== ''
      ? getFirestore(app, dbId)
      : getFirestore(app);

    // Mandated by Skill: Validate connection to Firestore on initialization
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Please check your Firebase configuration: Firestore client is offline.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Failed to initialize Firebase SDK, falling back to offline demo:", error);
  }
}

export const auth = authInstance;
export const db = dbInstance;

// Error handlers as mandated by the Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
