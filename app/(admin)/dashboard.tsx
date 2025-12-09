import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Kategori seçenekleri
const CATEGORIES = [
  { id: "all", label: "Tümü" },
  { id: "coffee", label: "Kahve" },
  { id: "equipment", label: "Ekipman" },
];

export default function AdminDashboard() {
  const router = useRouter();

  // Veri State'leri
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtre State'leri
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGridLayout, setIsGridLayout] = useState(false); // Varsayılan liste olsun, detay görmek için

  // 1. Verileri Canlı Dinle
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[];
      setAllProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Filtreleme Mantığı (Arama + Kategori)
  useEffect(() => {
    let result = allProducts;

    // Kategoriye göre süz
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Arama metnine göre süz
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, allProducts]);

  // Silme Fonksiyonu (Web/Mobil Uyumlu)
  const handleDelete = async (id: string) => {
    if (Platform.OS === "web") {
      const confirm = window.confirm("Bu ürünü silmek istediğine emin misin?");
      if (confirm) {
        try {
          await deleteDoc(doc(db, "products", id));
        } catch (error: any) {
          alert("Hata: " + error.message);
        }
      }
      return;
    }

    Alert.alert("Siliniyor", "Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => await deleteDoc(doc(db, "products", id)),
      },
    ]);
  };

  // Kart Bileşeni
  const renderItem = ({ item }: { item: Product }) => {
    // Kritik Stok Kontrolü (5'ten azsa kırmızı yap)
    const isLowStock = item.stock < 5;

    if (isGridLayout) {
      // --- IZGARA GÖRÜNÜMÜ (Kartlar) ---
      return (
        <View className="flex-1 m-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          {/* Stok Uyarısı (Köşede) */}
          {isLowStock && (
            <View className="absolute top-2 right-2 z-10 bg-red-100 px-2 py-1 rounded-md">
              <Text className="text-red-600 text-[10px] font-bold">
                STOK AZ
              </Text>
            </View>
          )}

          <Image
            source={{
              uri: item.images[0] || "https://via.placeholder.com/150",
            }}
            className="w-full h-32 object-cover bg-gray-100"
          />

          <View className="p-3">
            <Text
              className="font-bold text-gray-800 text-sm mb-1"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-amber-800 font-bold text-xs">
                {item.price} TL
              </Text>
              <Text
                className={`text-xs ${
                  isLowStock ? "text-red-500 font-bold" : "text-gray-400"
                }`}
              >
                Stok: {item.stock}
              </Text>
            </View>

            {/* Butonlar (Yan Yana) */}
            <View className="flex-row space-x-2 mt-1">
              <TouchableOpacity
                onPress={() => router.push(`/edit/${item.id}` as any)}
                className="flex-1 bg-blue-50 py-2 rounded-lg items-center"
              >
                <Ionicons name="create" size={16} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                className="flex-1 bg-red-50 py-2 rounded-lg items-center"
              >
                <Ionicons name="trash" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    } else {
      // --- LİSTE GÖRÜNÜMÜ (Satırlar) ---
      return (
        <View className="flex-row bg-white p-3 mb-3 rounded-xl shadow-sm border border-gray-100 items-center">
          <Image
            source={{
              uri: item.images[0] || "https://via.placeholder.com/100",
            }}
            className="w-16 h-16 rounded-lg bg-gray-100"
          />

          <View className="flex-1 ml-3 mr-2">
            <View className="flex-row justify-between">
              <Text
                className="font-bold text-gray-800 text-base flex-1"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isLowStock && (
                <Text className="text-red-500 text-xs font-bold ml-2">
                  KRİTİK STOK
                </Text>
              )}
            </View>

            <Text className="text-gray-500 text-xs mt-1">
              {item.category} • {item.stock} Adet
            </Text>
            <Text className="text-amber-800 font-bold mt-1">
              {item.price} {item.currency}
            </Text>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => router.push(`/edit/${item.id}` as any)}
              className="p-2 bg-blue-50 rounded-lg"
            >
              <Ionicons name="create-outline" size={20} color="#2563eb" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              className="p-2 bg-red-50 rounded-lg"
            >
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* --- ÜST PANEL (Search & Filter) --- */}
      <View className="bg-white p-4 pb-2 shadow-sm z-10">
        {/* Arama Barı */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2 mb-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Ürün ara..."
            className="flex-1 ml-2 text-gray-800 h-10"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtreler ve Layout Butonu */}
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row space-x-2">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full ${
                  selectedCategory === cat.id ? "bg-amber-900" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategory === cat.id ? "text-white" : "text-gray-600"
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setIsGridLayout(!isGridLayout)}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <Ionicons
              name={isGridLayout ? "list" : "grid"}
              size={20}
              color="#4b5563"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- LİSTE --- */}
      {loading ? (
        <ActivityIndicator size="large" color="#78350f" className="mt-10" />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          key={isGridLayout ? "grid" : "list"} // Layout değişince yeniden çizmesi için
          keyExtractor={(item) => item.id}
          numColumns={isGridLayout ? 2 : 1}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">Ürün bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* FAB (Ekle Butonu) */}
      <TouchableOpacity
        onPress={() => router.push("/(admin)/add")}
        className="absolute bottom-8 right-6 bg-amber-900 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
