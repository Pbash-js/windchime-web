import { useState, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  DocumentData, 
  collection, 
  getDocs, 
  deleteDoc,
  query,
  orderBy,
  WriteBatch,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// A generic document type, forcing id to be a string.
export type FirestoreDocument = { id: string } & DocumentData;

export const useFirestore = (basePath: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ensures the base document exists (e.g., /users/some-user-id)
  const ensureBaseDocExists = useCallback(async (batch?: WriteBatch) => {
    const baseDocRef = doc(db, basePath);
    const docSnap = await getDoc(baseDocRef);
    if (!docSnap.exists()) {
      const newDocData = { _createdAt: new Date().toISOString() };
      if (batch) {
        batch.set(baseDocRef, newDocData);
      } else {
        await setDoc(baseDocRef, newDocData);
      }
    }
  }, [basePath]);

  const getDocument = useCallback(async <T extends DocumentData>(documentId: string): Promise<T | null> => {
    setLoading(true);
    try {
      const docRef = doc(db, basePath, documentId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as T) : null;
    } catch (err) {
      console.error('Error getting document:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const setDocument = useCallback(async <T extends DocumentData>(documentId: string, data: T, merge = true): Promise<boolean> => {
    setLoading(true);
    try {
      await ensureBaseDocExists();
      const docRef = doc(db, basePath, documentId);
      await setDoc(docRef, data, { merge });
      return true;
    } catch (err) {
      console.error('Error setting document:', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [basePath, ensureBaseDocExists]);


  const getCollection = useCallback(async <T extends FirestoreDocument>(collectionName: string): Promise<T[]> => {
    setLoading(true);
    try {
      const collectionRef = collection(db, basePath, collectionName);
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (err) {
      console.error(`Error getting collection '${collectionName}':`, err);
      // If the collection doesn't exist, Firestore throws. Return empty array.
      if (err instanceof Error && 'code' in err && (err as any).code === 'failed-precondition') {
        return [];
      }
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const addDocument = useCallback(async <T extends DocumentData>(
    collectionName: string, 
    data: T
  ): Promise<(T & { id: string }) | null> => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      await ensureBaseDocExists(batch);

      const collectionRef = collection(db, basePath, collectionName);
      const newDocRef = doc(collectionRef);
      
      const now = new Date().toISOString();
      const newDocData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };

      batch.set(newDocRef, newDocData);
      await batch.commit();

      return { id: newDocRef.id, ...newDocData } as T & { id: string };
    } catch (err) {
      console.error(`Error adding document to '${collectionName}':`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [basePath, ensureBaseDocExists]);

  const updateDocumentInCollection = useCallback(async <T extends DocumentData>(
    collectionName: string, 
    documentId: string, 
    updates: Partial<T>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const docRef = doc(db, basePath, collectionName, documentId);
      // Exclude id and createdAt from updates, add updatedAt
      const finalUpdates = {
        ...(updates as object),
        updatedAt: new Date().toISOString()
      };
      delete (finalUpdates as any).id;
      delete (finalUpdates as any).createdAt;

      await updateDoc(docRef, finalUpdates);
      return true;
    } catch (err) {
      console.error(`Error updating document in '${collectionName}':`, err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const deleteDocument = useCallback(async (collectionName: string, documentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const docRef = doc(db, basePath, collectionName, documentId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error(`Error deleting document from '${collectionName}':`, err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  return {
    loading,
    error,
    getDocument,
    setDocument,
    getCollection,
    addDocument,
    updateDocument: updateDocumentInCollection,
    deleteDocument,
  };
};
