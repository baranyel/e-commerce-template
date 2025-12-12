import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { ProductCard } from "../../components/ui/ProductCard";
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
import { useTranslation } from "react-i18next";

interface Category {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  // DİNAMİK KATEGORİ STATE
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "all" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Veri State'leri
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtre State'leri
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories([{ id: "all", name: "all" }, ...fetchedCats]);
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

  // Kart Bileşeni (Refactored)
  const renderItem = ({ item }: { item: Product }) => {
    return (
        <ProductCard
            item={item}
            layout={isGridLayout ? "grid" : "list"}
            isAdmin
            onPress={() => {}} // Admin modunda karta tıklayınca bir şey olmuyor genelde, ya da detay?
            onEdit={(product) => router.push(`/edit/${product.id}` as any)}
            onDelete={(product) => handleDelete(product.id)}
        />
    );
  };

  return (
    <ScreenWrapper>

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

        {/* --- DİNAMİK FİLTRELER (DEĞİŞEN KISIM) --- */}
        <View className="flex-row justify-between items-center mb-2">
          {/* ScrollView kullanıyoruz ki kategoriler taşarsa kaydırılabilsin */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
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
    </ScreenWrapper>
  );
}
