import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  Modal, // Modal eklendi (Alternatif olarak absolute view de kullanılabilir ama Modal garanti çözüm)
  Platform,
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { ProductCard } from "../../components/ui/ProductCard";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";

interface Category {
  id: string;
  name: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  // --- RESPONSIVE AYARLAR ---
  const { width, height } = useWindowDimensions();
  const isWeb = width > 768;

  // Konteyner Genişliği (Max 1200px)
  const containerWidth = Math.min(width, 1200);
  const SIDEBAR_WIDTH = 250;
  const contentWidth = isWeb ? containerWidth - SIDEBAR_WIDTH : width;
  const numColumns = isWeb ? 3 : 2;

  // Kart Genişliği
  const PADDING = 12;
  const GAP = 12;
  const totalGap = (numColumns - 1) * GAP;
  const cardWidth = (contentWidth - PADDING * 2 - totalGap) / numColumns;

  // State'ler
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "all" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [loading, setLoading] = useState(true);

  // YENİ STATE: Mobilde filtrenin açık/kapalı durumu
  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Veri Çekme
  useEffect(() => {
    const qCat = query(collection(db, "categories"), orderBy("name"));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const fetchedCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories([{ id: "all", name: "all" }, ...fetchedCats]);
    });

    const qProd = query(collection(db, "products"), orderBy("title"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[];
      setAllProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  // Filtreleme Mantığı
  useEffect(() => {
    let result = allProducts;
    if (selectedCategory !== "all")
      result = result.filter((p) => p.category === selectedCategory);
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      );
    }
    if (minPrice)
      result = result.filter((p) => p.price >= parseFloat(minPrice));
    if (maxPrice)
      result = result.filter((p) => p.price <= parseFloat(maxPrice));
    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, allProducts]);

  // --- ORTAK FİLTRE BİLEŞENİ ---
  // isMobileSidebar: Eğer true ise mobildeki sidebar içindeyiz demektir, ona göre styling yaparız.
  const FilterContent = ({ isMobileSidebar = false }) => (
    <View className="flex-1">
      {/* Mobilde Başlık ve Kapat Butonu */}
      {isMobileSidebar && (
        <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-800">Filtreler</Text>
          <TouchableOpacity
            onPress={() => setMobileFilterOpen(false)}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

      {/* Web Başlığı */}
      {!isMobileSidebar && isWeb && (
        <Text className="text-xl font-bold text-gray-800 mb-4">
          {t("common.filter")}
        </Text>
      )}

      {/* Arama */}
      <View className="bg-gray-100 rounded-xl px-3 py-3 mb-4 flex-row items-center">
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Ara..."
          className="flex-1 ml-2 text-gray-700 font-medium h-full outline-none" // outline-none web için
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategoriler */}
      <View className="mb-6">
        <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
          {t("admin.category")}
        </Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedCategory(item.name)}
              className={`py-2 px-3 mb-1 rounded-lg flex-row items-center ${
                selectedCategory === item.name ? "bg-amber-50" : ""
              }`}
            >
              <View
                className={`w-4 h-4 rounded-full border mr-2 items-center justify-center ${
                  selectedCategory === item.name
                    ? "border-amber-900 bg-amber-900"
                    : "border-gray-300"
                }`}
              >
                {selectedCategory === item.name && (
                  <Ionicons name="checkmark" size={10} color="white" />
                )}
              </View>
              <Text
                className={`${
                  selectedCategory === item.name
                    ? "text-amber-900 font-bold"
                    : "text-gray-600"
                }`}
              >
                {item.id === "all" ? t("common.all") : item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fiyat */}
      <View>
        <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
          {t("admin.price")}
        </Text>
        <View className="flex-row items-center space-x-2 w-full">
          <TextInput
            placeholder="Min"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
            // flex-1: Alanı kapla, min-w-0: Asla taşma yapma (text uzasa bile)
            className="flex-1 min-w-0 bg-white border border-gray-200 p-2 rounded-lg text-sm"
          />

          {/* Araya küçük bir tire (-) koydum, daha anlaşılır olur */}
          <Text className="text-gray-400 font-bold">-</Text>

          <TextInput
            placeholder="Max"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
            // flex-1: Alanı kapla, min-w-0: Asla taşma yapma
            className="flex-1 min-w-0 bg-white border border-gray-200 p-2 rounded-lg text-sm"
          />
        </View>
        {(minPrice || maxPrice) && (
          <TouchableOpacity
            onPress={() => {
              setMinPrice("");
              setMaxPrice("");
            }}
            className="mt-2"
          >
            <Text className="text-xs text-amber-800 font-bold text-right underline">
              Temizle
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mobilde "Sonuçları Göster" Butonu */}
      {isMobileSidebar && (
        <TouchableOpacity
          onPress={() => setMobileFilterOpen(false)}
          className="mt-auto bg-amber-900 py-3 rounded-xl items-center mb-4 shadow-md"
        >
          <Text className="text-white font-bold">
            Sonuçları Göster ({filteredProducts.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

<<<<<<< HEAD
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

=======
  const renderItem = ({ item }: { item: Product }) => {
    const titleSize = isWeb ? "text-base" : "text-xs";
    const priceSize = isWeb ? "text-lg" : "text-xs";

    if (isGridLayout) {
      return (
        <TouchableOpacity
          onPress={() => router.push(`/product/${item.id}` as any)}
          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-3"
          style={{ width: cardWidth }}
        >
          <Image
            source={{ uri: item.images[0] }}
            className="w-full aspect-square object-cover bg-gray-50"
          />
          <View className={isWeb ? "p-4" : "p-2"}>
            <Text
              className={`text-gray-900 font-bold mb-1 ${titleSize}`}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text className={`text-amber-800 font-bold ${priceSize}`}>
              {item.price} {item.currency}
            </Text>
            {isWeb && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(item);
                }}
                className="mt-3 bg-amber-100 py-2 rounded-lg items-center"
              >
                <Text className="text-amber-900 font-bold text-sm">
                  Sepete Ekle
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          onPress={() => router.push(`/product/${item.id}` as any)}
          className="flex-row mb-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-3 w-full"
        >
          <Image
            source={{ uri: item.images[0] }}
            className="w-24 h-24 rounded-lg bg-gray-100 aspect-square object-cover"
          />
          <View className="flex-1 ml-4 justify-between py-1">
            <View>
              <Text className="text-xs text-amber-800 font-bold uppercase mb-1">
                {item.category}
              </Text>
              <Text className="text-gray-900 font-bold text-base">
                {item.title}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-sm font-bold text-gray-900">
                {item.price} {item.currency}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(item);
                }}
                className="bg-amber-100 px-3 py-1 rounded-full"
              >
                <Text className="text-amber-900 font-bold text-xl">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center">
      {/* --- MOBİL İÇİN SIDEBAR (DRAWER) --- */}
      {/* Web'de görünmez. Mobilde state true olunca açılır. */}
      {!isWeb && isMobileFilterOpen && (
        <View className="absolute inset-0 z-50 flex-row">
          {/* Arka Plan Karartma (Overlay) - Tıklayınca kapanır */}
>>>>>>> 94bc014128e0a6e78ca63ca4fae5bae45c77b4e5
          <TouchableOpacity
            activeOpacity={1}
            className="absolute inset-0 bg-black/50" // bg-black opacity-50
            onPress={() => setMobileFilterOpen(false)}
          />

          {/* Beyaz Panel - Soldan %75 genişlikte */}
          <View className="w-[80%] h-full bg-white p-5 shadow-2xl z-50">
            <FilterContent isMobileSidebar={true} />
          </View>
        </View>
      )}

      <View className="flex-1 w-full" style={{ maxWidth: 1200 }}>
        {/* --- MOBİL ÜST BAR (HEADER) --- */}
        {!isWeb && (
          <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
            {/* Sol taraf: Filtre Butonu */}
            <TouchableOpacity
              onPress={() => setMobileFilterOpen(true)}
              className="flex-row items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
            >
              <Ionicons name="filter" size={18} color="#4b5563" />
              <Text className="text-gray-700 font-medium text-sm">
                Filtrele
              </Text>
            </TouchableOpacity>

            {/* Sağ Taraf: Görünüm Butonu */}
            <TouchableOpacity
              onPress={() => setIsGridLayout(!isGridLayout)}
              className="p-2"
            >
              <Ionicons
                name={isGridLayout ? "list" : "grid"}
                size={22}
                color="#4b5563"
              />
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-1 flex-row pt-4 px-4">
          {/* --- WEB SIDEBAR (SOL SABİT) --- */}
          {isWeb && (
            <View style={{ width: SIDEBAR_WIDTH }} className="mr-6">
              <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm sticky top-4">
                <FilterContent />
              </View>
            </View>
          )}

          {/* --- ÜRÜN LİSTESİ --- */}
          <FlatList
            key={isGridLayout ? `grid-${numColumns}` : "list"}
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={isGridLayout ? numColumns : 1}
            contentContainerStyle={{ paddingBottom: 20 }}
            columnWrapperStyle={isGridLayout ? { gap: GAP } : undefined}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isWeb ? (
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-500 font-bold">
                    {filteredProducts.length} Ürün Bulundu
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsGridLayout(!isGridLayout)}
                    className="p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <Ionicons
                      name={isGridLayout ? "list" : "grid"}
                      size={20}
                      color="#4b5563"
                    />
                  </TouchableOpacity>
                </View>
              ) : null
            }
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
        </View>
      </View>
<<<<<<< HEAD

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
=======
    </SafeAreaView>
>>>>>>> 94bc014128e0a6e78ca63ca4fae5bae45c77b4e5
  );
}
