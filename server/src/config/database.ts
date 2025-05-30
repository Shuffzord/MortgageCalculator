import { firestore } from './firebase';

export const db = firestore;

export const collections = {
  users: db.collection('users'),
  calculations: db.collection('calculations'),
};