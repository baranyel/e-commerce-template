import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { seedDatabase } from "../../firebase/seed"; // Seed fonksiyonunu al
import { Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext"; // Direk eklemek istersen

export default function HomeScreen() {
  const router = useRouter(); // <-- Router'ı tanımla
  const { addToCart } = useCart(); // <-- Sepet fonksiyonunu al
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verileri Firebase'den Çekme Fonksiyonu
  useEffect(() => {
    setLoading(true);

    // Veritabanını canlı dinle
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProducts: Product[] = [];
        snapshot.forEach((doc) => {
          fetchedProducts.push({
            ...doc.data(),
            id: doc.id,
          } as Product);
        });

        setProducts(fetchedProducts);
        setLoading(false);
        setRefreshing(false); // Refresh ediliyorsa durdur
      },
      (error) => {
        console.error("Veri çekme hatası:", error);
        setLoading(false);
      }
    );

    // Sayfadan çıkınca dinlemeyi bırak
    return () => unsubscribe();
  }, []);

  // onRefresh fonksiyonunu da güncelle (Sadece loading state'ini tetiklesin yeter, onSnapshot zaten güncel)
  const onRefresh = () => {
    setRefreshing(true);
    // onSnapshot zaten canlı olduğu için ekstra bir şey yapmaya gerek yok ama
    // kullanıcı hissiyatı için 1 saniye bekletip kapatabiliriz.
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Tekil Ürün Kartı Bileşeni (Render Item)
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => router.push(`/product/${item.id}` as any)}
      className="flex-1 m-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
    >
      <Image
        source={{ uri: item.images[0] }}
        className="w-full h-40 object-cover"
      />
      <View className="p-3">
        {/* ... diğer textler ... */}

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-amber-800 font-bold text-base">
            {item.price} {item.currency}
          </Text>

          {/* Ana sayfadan direkt eklemek için buton */}
          <TouchableOpacity
            onPress={() => addToCart(item)} // Tıklanınca sepete atar
            className="bg-amber-100 p-2 rounded-full"
          >
            {/* İkon kullanmak için @expo/vector-icons ekleyebilirsin veya Text kalsın */}
            <Text className="text-amber-800 font-bold text-xs">+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Üst Başlık */}
      <View className="px-4 py-3 flex-row justify-between items-center bg-white shadow-sm">
        <View>
          <Text className="text-gray-400 text-xs">Hoşgeldin,</Text>
          <Text className="text-amber-900 font-bold text-xl">
            Lupin Coffee 👋
          </Text>
        </View>
        {/* Veri Yükle Butonu (Geliştirme Amaçlı) */}
        {products.length === 0 && !loading && (
          <TouchableOpacity
            onPress={seedDatabase}
            className="bg-gray-200 px-3 py-1 rounded-lg"
          >
            <Text className="text-xs font-bold text-gray-600">
              Verileri Yükle
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ürün Listesi */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#78350f" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2} // İkili ızgara görünümü
          contentContainerStyle={{ padding: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-400">Henüz ürün bulunmuyor.</Text>
              <Text className="text-gray-400 text-xs mt-2">
                Sağ üstten veri yükleyebilirsin.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
