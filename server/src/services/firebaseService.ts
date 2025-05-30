import { firestore } from '../config/firebase';

export class FirebaseService {
  static async create(collection: string, data: any): Promise<string> {
    const docRef = await firestore.collection(collection).add(data);
    return docRef.id;
  }

  static async read(collection: string, id: string): Promise<any> {
    const doc = await firestore.collection(collection).doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  static async update(collection: string, id: string, data: any): Promise<void> {
    await firestore.collection(collection).doc(id).update(data);
  }

  static async delete(collection: string, id: string): Promise<void> {
    await firestore.collection(collection).doc(id).delete();
  }

  static async query(collection: string, field: string, operator: any, value: any): Promise<any[]> {
    const snapshot = await firestore.collection(collection).where(field, operator, value).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}