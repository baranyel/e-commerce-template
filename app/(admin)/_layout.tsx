import { Stack, useRouter } from "expo-router"; // useRouter'ı eklemeyi unutma
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      // Geçmiş varsa normal geri git
      router.back();
    } else {
      // Geçmiş yoksa (F5 atıldıysa) zorla Profil sekmesine git
      router.replace("/(tabs)/profile");
    }
  };

  return (
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
          title: "Ürün Yönetimi",
          // GÜNCELLENEN KISIM BURASI:
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={{ marginRight: 15 }}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="add" options={{ title: "Yeni Ürün Ekle" }} />
      {/* Edit sayfası için de başlık ayarı ekleyelim */}
      <Stack.Screen name="edit/[id]" options={{ title: "Ürünü Düzenle" }} />
    </Stack>
  );
}
