import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { CartProvider } from "../context/CartContext";
import CartSidebar from "../components/CartSidebar";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Import ekle
import Toast from "react-native-toast-message";
import i18n from "../i18n/i18n"; // <-- i18n'i import et
import "../global.css";

// Core Navigation Logic
import { usePushNotifications } from "../hooks/usePushNotifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { LoadingProvider } from "../context/LoadingContext"; // 1. Import LoadingProvider
import { CurtainLoader } from "../components/ui/CurtainLoader"; // 1. Import CurtainLoader

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Initialize Notifications & Get Token
  const { expoPushToken } = usePushNotifications();

  // Save Token to Firestore when User logins
  useEffect(() => {
    if (user && expoPushToken) {
       const saveToken = async () => {
         try {
           await setDoc(doc(db, "users", user.uid), { pushToken: expoPushToken }, { merge: true });
         } catch (e) {
           console.log("Error saving push token:", e);
         }
       };
       saveToken();
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inLoginRoute = segments[0] === "login";

    if (!user && !inLoginRoute) {
      router.replace("/login");
    } else if (user && inLoginRoute) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("language");
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
      } catch (e) {
        console.log("Dil yüklenemedi:", e);
      }
    };
    loadLanguage();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4a2c2a" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <LoadingProvider>
            <RootLayoutNav />
            <CartSidebar />
            <CurtainLoader />
            <Toast />
          </LoadingProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
