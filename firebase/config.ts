import { initializeApp, getApp, getApps } from "firebase/app";
// 1. DEĞİŞİKLİK: 'Auth' tipini import listesine ekle
import {
  initializeAuth,
  getAuth,
  // @ts-ignore
  getReactNativePersistence,
  Auth, // <--- BURAYA EKLE
} from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore"; // initializeFirestore ekle
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAUNX_HBJU3LWjGu7lVAy9AzJ6dxg-RVqo",
  authDomain: "lupin-coffee.firebaseapp.com",
  projectId: "lupin-coffee",
  storageBucket: "lupin-coffee.firebasestorage.app",
  messagingSenderId: "1060679330394",
  appId: "1:1060679330394:web:11a8f3f12b5fba3ace8663",
  measurementId: "G-43B327RSVG",
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. DEĞİŞİKLİK: Değişkenin tipini belirt
let auth: Auth; // <--- SADECE 'let auth;' YAZAN YERİ BU ŞEKİLDE DEĞİŞTİR

if (Platform.OS === "web") {
  if (typeof window === "undefined") {
    auth = initializeAuth(app);
  } else {
    auth = getAuth(app);
  }
} else {
  auth = initializeAuth(app, {
    // @ts-ignore
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Adblocker engeline takılmamak için Long Polling kullan
});
const storage = getStorage(app);
export { auth, db, storage };
