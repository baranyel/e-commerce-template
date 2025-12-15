import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  useWindowDimensions,
  Image,
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { ProductCard } from "../../components/ui/ProductCard";
import {
  collection,
  query,
  onSnapshot,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { seedDatabase } from "../../firebase/seed";
import { Product } from "../../types";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]); // Renamed from products
  const [loading, setLoading] = useState(true);

  // Veri Çekme
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "products"),
      where("isFeatured", "==", true),
      limit(10) // Fetch slightly more to accommodate client-side filtering
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Product;
        // Client-side filter: Treat undefined as true (Active)
        if (data.isActive === false) return;
        
        fetchedProducts.push({
          id: doc.id,
          ...data,
        });
      });
      setFeaturedProducts(fetchedProducts.slice(0, 5)); // Set featured products, sliced to 5
      setLoading(false);
    });

    return unsubscribe; // Correct cleanup function
  }, []);

  // --- BİLEŞENLER ---

  // 1. HERO BÖLÜMÜ (Marka Tanıtımı)
  const HeroSection = () => (
    <View className="mb-8 rounded-3xl overflow-hidden shadow-lg mx-4 mt-4 h-64">
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop",
        }}
        className="flex-1 justify-center px-6 bg-gray-900"
        imageStyle={{ opacity: 0.7 }}
      >
        <Text className="text-amber-400 font-bold text-sm tracking-widest uppercase mb-2">
          {t("home.hero.brand")}
        </Text>
        <Text className="text-white text-4xl font-extrabold mb-4 leading-tight">
          {t("home.hero.title")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/two")}
          className="bg-amber-500 self-start px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">{t("home.hero.cta")}</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );

  // 2. HİKAYE BÖLÜMÜ
  const StorySection = () => (
    <View className="px-6 mb-10">
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        {t("home.story.title")}
      </Text>
      <Text className="text-gray-600 text-center leading-6">
        {t("home.story.content")}
      </Text>
      <View className="items-center mt-4">
        <View className="w-16 h-1 bg-amber-800 rounded-full" />
      </View>
    </View>
  );

  // 3. KALİTE VURGUSU (Feature Icons)
  const QualitySection = () => (
    <View className="flex-row justify-around px-4 mb-10 bg-amber-50 py-8 mx-4 rounded-2xl border border-amber-100">
      <View className="items-center">
        <View className="bg-white p-3 rounded-full shadow-sm mb-2">
          <Ionicons name="leaf" size={24} color="#78350f" />
        </View>
        <Text className="font-bold text-gray-800 text-xs uppercase">
          {t("home.quality.organic")}
        </Text>
      </View>
      <View className="items-center">
        <View className="bg-white p-3 rounded-full shadow-sm mb-2">
          <Ionicons name="flame" size={24} color="#78350f" />
        </View>
        <Text className="font-bold text-gray-800 text-xs uppercase">
          {t("home.quality.fresh")}
        </Text>
      </View>
      <View className="items-center">
        <View className="bg-white p-3 rounded-full shadow-sm mb-2">
          <Ionicons name="rocket" size={24} color="#78350f" />
        </View>
        <Text className="font-bold text-gray-800 text-xs uppercase">
          {t("home.quality.fastShipping")}
        </Text>
      </View>
    </View>
  );

  // 4. ÜRÜN KARTI (Yatay Carousel İçin)
  const renderCarouselItem = ({ item }: { item: Product }) => (
    <ProductCard
      item={item}
      layout="grid"
      isAdmin={false}
      onPress={() => router.push(`/product/${item.id}` as any)}
      onAddToCart={(product) => addToCart(product)}
      containerStyle={{ width: 192, marginRight: 16 }} // 192 = w-48
    />
  );

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header Kısmı */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white shadow-sm z-10 sticky top-0 w-full">
          <Text className="text-amber-900 font-bold text-xl tracking-tight">
            Lupin Coffee.
          </Text>
          {featuredProducts.length === 0 && !loading && (
            <TouchableOpacity
              onPress={seedDatabase}
              className="bg-gray-200 px-3 py-1 rounded-lg"
            >
              <Text className="text-xs font-bold text-gray-600">
                {t("home.seedData")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Hikaye */}
        <StorySection />

        {/* 3. Kalite */}
        <QualitySection />

        {/* 4. Vitrin (Çok Satanlar / Kategoriler) */}
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-xl font-bold text-gray-800">
              {t("home.sections.bestSellers")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/two")}>
              <Text className="text-amber-800 font-bold text-sm">
                {t("home.sections.viewAll")}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#78350f" />
          ) : (
            <FlatList
              horizontal
              data={featuredProducts.slice(0, 5)} // Sadece ilk 5 ürünü göster
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 4,
                paddingBottom: 10,
              }}
            />
          )}
        </View>

        {/* Ekstra Vitrin (Örneğin: Sizin İçin Seçtiklerimiz) */}
        <View className="px-4 mt-6">
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-xl font-bold text-gray-800">
              {t("home.sections.recommendations")}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#78350f" />
          ) : (
            <FlatList
              horizontal
              // Listeyi ters çevirip farklı ürünler gösterelim
              data={[...featuredProducts].reverse().slice(0, 5)}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id + "_reverse"}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 4,
                paddingBottom: 10,
              }}
            />
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
