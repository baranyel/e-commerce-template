import { Stack, useRouter } from "expo-router"; // useRouter'ı eklemeyi unutma
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function AdminLayout() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleClose = () => {
    if (router.canGoBack()) {
      // Geçmiş varsa normal geri git
      router.back();
    } else {
      // Geçmiş yoksa (F5 atıldıysa) zorla Profil sekmesine git
      router.replace("/(tabs)/profile");
    }
  };

  const colorScheme = useColorScheme();

  // Renk Ayarları
  // Dış taraf (Boşluklar): Açık modda Gri (#F3F4F6), Koyu modda Tam Siyah
  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";

  // İç taraf (İçerik): Açık modda Beyaz, Koyu modda Koyu Gri/Siyah
  const innerBackgroundColor = Colors[colorScheme ?? "light"].background;

  return (
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          // Web'de kenarlarda gölge olsun istersen bunu açabilirsin:
          // shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
        }}
      >
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#000",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          <Stack.Screen
            name="dashboard"
            options={{
              title: t(`products`),
              // GÜNCELLENEN KISIM BURASI:
              headerLeft: () => (
                <TouchableOpacity
                  onPress={handleClose}
                  style={{ marginRight: 15 }}
                >
                  <Ionicons name="close" size={28} color="black" />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen name="add" options={{ title: "Yeni Ürün Ekle" }} />
          {/* Edit sayfası için de başlık ayarı ekleyelim */}
          <Stack.Screen name="edit/[id]" options={{ title: "Ürünü Düzenle" }} />
          <Stack.Screen
            name="orders"
            options={{ title: t(`adminOrders.title`) }}
          />
        </Stack>
      </View>
    </View>
  );
}
