import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { CartProvider } from "../context/CartContext";
import CartSidebar from "../components/CartSidebar";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Import ekle
import i18n from "../i18n/i18n"; // <-- i18n'i import et
import "../global.css";

// Bu component sadece routing kontrolünü yapar
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments(); // Kullanıcının şu an hangi sayfada olduğunu söyler
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inLoginRoute = segments[0] === "login"; // Kullanıcı şu an Login sayfasında mı?

    if (!user && !inLoginRoute) {
      // 1. Kullanıcı YOKSA ve Login sayfasında DEĞİLSE -> Login'e at
      router.replace("/login");
    } else if (user && inLoginRoute) {
      // 2. Kullanıcı VARSA ve Login sayfasına girmeye çalışıyorsa -> Ana Sayfaya (Tabs) at
      router.replace("/(tabs)");
    }
    // 3. Kullanıcı VARSA ve Login dışında bir yerdeyse (Örn: /product/123) -> KARIŞMA, rahat bıraksın.
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
    // Siyah ekran yerine dönen bir çark gösterelim
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4a2c2a" />
        {/* NativeWind v4 ile stil veriyoruz */}
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login ekranı */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      {/* Ana uygulama (Sekmeler) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          {" "}
          {/* <-- AUTH PROVIDER'IN İÇİNE EKLE */}
          <RootLayoutNav />
          <CartSidebar />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
