import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // <-- onSnapshot EKLENDİ
import { auth, db } from "../firebase/config";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Firebase Auth Dinleyicisi
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        // 2. Firestore Profil Dinleyicisi (CANLI TAKİP)
        const userDocRef = doc(db, "users", firebaseUser.uid);

        // onSnapshot: Veritabanında profil değiştiği an (mobilde veya webde)
        // burası tetiklenir ve tüm uygulamadaki veriyi günceller.
        const unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setUserProfile(docSnapshot.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Profil dinleme hatası:", error);
            setLoading(false);
          }
        );

        // Cleanup: Kullanıcı çıkış yaparsa profil dinlemeyi bırak
        return () => unsubscribeProfile();
      } else {
        // Kullanıcı yoksa her şeyi sıfırla
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
