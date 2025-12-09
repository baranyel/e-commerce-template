import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null; // Firebase'in kendi user objesi
  userProfile: UserProfile | null; // Bizim veritabanındaki detaylı profil (rol bilgisi burada)
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
    // Firebase Auth durumunu dinle (Giriş/Çıkış olduğunda tetiklenir)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Kullanıcı giriş yaptıysa, Firestore'dan rolünü ve detaylarını çek
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        // Kullanıcı çıkış yaptıysa profili sıfırla
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
