import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";

// Kategoriler
const CATEGORIES = [
  { id: "all", label: "Tümü" },
  { id: "coffee", label: "Kahveler" },
  { id: "equipment", label: "Ekipmanlar" },
];

export default function SearchScreen() {
  const router = useRouter();
  const { addToCart } = useCart();

  // State'ler
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGridLayout, setIsGridLayout] = useState(true); // Grid mi Liste mi?
  const [loading, setLoading] = useState(true);

  // Verileri Çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("title"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data() as Product);
        setAllProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtreleme Mantığı (Arama + Kategori)
  useEffect(() => {
    let result = allProducts;

    // 1. Kategori Filtresi
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 2. Arama Filtresi
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

  // Ürün Kartı (Grid ve Liste Moduna Göre Değişir)
  const renderItem = ({ item }: { item: Product }) => {
    if (isGridLayout) {
      // --- IZGARA GÖRÜNÜMÜ (2 Sütun) ---
      return (
        <TouchableOpacity
          onPress={() => router.push(`/product/${item.id}` as any)}
          className="flex-1 m-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <Image
            source={{ uri: item.images[0] }}
            className="w-full h-36 object-cover"
          />
          <View className="p-3">
            <Text
              className="text-gray-900 font-bold text-sm mb-1"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-amber-800 font-bold text-xs">
              {item.price} {item.currency}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      // --- LİSTE GÖRÜNÜMÜ (Tek Sütun - Detaylı) ---
      return (
        <TouchableOpacity
          onPress={() => router.push(`/product/${item.id}` as any)}
          className="flex-row mb-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-3"
        >
          <Image
            source={{ uri: item.images[0] }}
            className="w-24 h-24 rounded-lg bg-gray-100"
          />
          <View className="flex-1 ml-4 justify-between py-1">
            <View>
              <Text className="text-xs text-amber-800 font-bold uppercase mb-1">
                {item.category}
              </Text>
              <Text className="text-gray-900 font-bold text-lg">
                {item.title}
              </Text>
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-lg font-bold text-gray-900">
                {item.price} {item.currency}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // Karta tıklamayı engelle, sadece sepete ekle
                  addToCart(item);
                }}
                className="bg-amber-100 px-3 py-1 rounded-full"
              >
                <Text className="text-amber-900 font-bold text-xs">Ekle +</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-4 bg-white shadow-sm z-10">
        {/* Arama Barı */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Kahve veya ekipman ara..."
            className="flex-1 ml-3 text-gray-700 font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtreler ve Layout Toggle */}
        <View className="flex-row justify-between items-center">
          {/* Kategoriler */}
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

          {/* Grid/List Toggle Butonu */}
          <TouchableOpacity
            onPress={() => setIsGridLayout(!isGridLayout)}
            className="p-2 bg-gray-100 rounded-lg ml-2"
          >
            <Ionicons
              name={isGridLayout ? "list" : "grid"}
              size={20}
              color="#4b5563"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sonuç Listesi */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        // Grid durumuna göre sütun sayısını değiştiriyoruz (Kritik Nokta)
        key={isGridLayout ? "grid" : "list"} // Key değişince FlatList yeniden render olur (zorunlu)
        numColumns={isGridLayout ? 2 : 1}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 font-medium">
              Sonuç bulunamadı :(
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
