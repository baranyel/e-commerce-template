import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { ProductCard } from "../../components/ui/ProductCard";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // onSnapshot ekle
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next"; // Çeviri

interface Category {
  id: string;
  name: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  // State'ler
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // DİNAMİK KATEGORİ STATE'İ (Varsayılan olarak sadece 'Tümü' var)
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "all" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Kategorileri Canlı Çek
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      // En başa "Tümü" seçeneğini, devamına veritabanını ekle
      setCategories([{ id: "all", name: "all" }, ...fetchedCats]);
    });
    return unsubscribe;
  }, []);

  // 2. Ürünleri Canlı Çek
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "products"), orderBy("title"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[];

      setAllProducts(data);
      // İlk yüklemede filtrelemeden göster
      setFilteredProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 3. Filtreleme Mantığı
  useEffect(() => {
    let result = allProducts;

    // Kategori Filtresi
    if (selectedCategory !== "all") {
      // DİKKAT: Ürünlerdeki kategori ismi ile buradaki isim eşleşmeli
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Arama Filtresi
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

  // ... renderItem fonksiyonu REFACTORED ...
  // (Sadece renderItem içindeki tasarımı değiştirmedik)
  const renderItem = ({ item }: { item: Product }) => {
     return (
        <ProductCard
            item={item}
            layout={isGridLayout ? "grid" : "list"}
            onPress={() => router.push(`/product/${item.id}` as any)}
            onAddToCart={(product) => addToCart(product)}
        />
     );
  };

  return (
    <ScreenWrapper>
      <View className="p-4 bg-white shadow-sm z-10 w-full">
        {/* Arama Barı - AYNI */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Ara..."
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

        {/* --- DİNAMİK KATEGORİ LİSTESİ (GÜNCELLENEN KISIM) --- */}
        <View className="flex-row justify-between items-center">
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.name)}
                className={`px-3 py-1.5 rounded-full mr-2 ${
                  selectedCategory === item.name
                    ? "bg-amber-900"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategory === item.name
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {/* Eğer id 'all' ise çeviriyi kullan, yoksa kategori adını yaz */}
                  {item.id === "all" ? t("common.all") : item.name}
                </Text>
              </TouchableOpacity>
            )}
          />

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

      {/* Liste - AYNI */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        key={isGridLayout ? "grid" : "list"}
        numColumns={isGridLayout ? 2 : 1}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <View className="items-center mt-20">
            {loading ? (
              <ActivityIndicator color="#78350f" />
            ) : (
              <Text className="text-gray-400">Sonuç yok.</Text>
            )}
          </View>
        }
      />
    </ScreenWrapper>
  );
}
