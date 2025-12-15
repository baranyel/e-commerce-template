import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc, collection, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useFavorites = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setLoading(false);
      return;
    }

    // Subscribe to sub-collection 'favorites'
    const favCollection = collection(db, 'users', user.uid, 'favorites');
    
    // Safety check just in case, though onSnapshot usually handles empty paths gracefully or errors out if param is invalid
    if (!favCollection) return;

    const unsub = onSnapshot(favCollection, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.id);
      setFavoriteIds(ids);
      setLoading(false);
    }, (error) => {
      console.error("Favorites listener error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const toggleFavorite = async (product: Product) => {
    if (!user) {
        Toast.show({
            type: 'info',
            text1: t('common.error'),
            text2: t('auth.guestAlert'),
        });
        return;
    }

    const isFavorite = favoriteIds.includes(product.id);
    const ref = doc(db, 'users', user.uid, 'favorites', product.id);
    const productRef = doc(db, 'products', product.id);

    try {
        if (isFavorite) {
            await deleteDoc(ref);
            // Decrement counter
            try {
                await updateDoc(productRef, { favoriteCount: increment(-1) });
            } catch (e) {
                console.log("Counter update failed", e);
            }
        } else {
            await setDoc(ref, {
                productId: product.id,
                addedAt: Date.now()
            });
            // Increment counter
            try {
                await updateDoc(productRef, { favoriteCount: increment(1) });
            } catch (e) {
                console.log("Counter update failed", e);
            }

            Toast.show({
                type: 'success',
                text1: t('favorites.title'),
                text2: t('favorites.added'),
                visibilityTime: 1500,
            });
        }
    } catch (error) {
        console.error("Toggle favorite error:", error);
         Toast.show({
            type: 'error',
            text1: t('common.error'),
        });
    }
  };

  return { favoriteIds, toggleFavorite, loading };
};
