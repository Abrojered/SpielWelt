import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit as limitQuery,
  increment,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDnGqDzeK7d0NxktMBXvZcyKRM5fEN229c',
  authDomain: 'spielwelt-161f9.firebaseapp.com',
  projectId: 'spielwelt-161f9',
  storageBucket: 'spielwelt-161f9.firebasestorage.app',
  messagingSenderId: '1055558586318',
  appId: '1:1055558586318:web:276ff42ea5cb682b7ba59f',
  measurementId: 'G-4X0375DMQ5',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const incrementSearchCount = async (searchTerm, game) => {
  if (!searchTerm) return;

  const gameId = game?.id
    ? String(game.id)
    : searchTerm.trim().toLowerCase().replace(/\W+/g, '_');
  if (!gameId) return;

  const gameName = game?.name || searchTerm;
  const posterUrl = game?.background_image || '';
  const docRef = doc(db, 'gameSearchStats', gameId); 

  try {
    await setDoc(
      docRef,
      {
        gameId,
        gameName,
        searchTerm,
        posterUrl,
        count: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Firebase search count error:', error);
  }
};

export const getTrendingGames = async (limit = 5) => {
  try {
    const trendingQuery = query(
      collection(db, 'gameSearchStats'),
      orderBy('count', 'desc'),
      limitQuery(limit)
    );

    const snapshot = await getDocs(trendingQuery);
    return snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));
  } catch (error) {
    console.error('Firebase trending games error:', error);
    return [];
  }
};
