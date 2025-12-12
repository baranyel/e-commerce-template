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
} from "react-native";
<<<<<<< HEAD
// import { SafeAreaView } from "react-native-safe-area-context"; // Removed
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { ProductCard } from "../../components/ui/ProductCard";
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
=======
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
>>>>>>> 94bc014128e0a6e78ca63ca4fae5bae45c77b4e5
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons"; // İkonlar için
import { useTranslation } from "react-i18next";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive Ayarlar
  const isWeb = width > 768;
  const containerStyle = {
    flex: 1,
    maxWidth: 1200,
    alignSelf: "center" as const,
    backgroundColor: Colors[colorScheme ?? "light"].background,
  };

  // Arka plan rengi (Web'de kenarlar gri kalsın diye)
  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";

  // Veri Çekme
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        fetchedProducts.push({ ...doc.data(), id: doc.id } as Product);
      });
      setProducts(fetchedProducts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- BİLEŞENLER ---

<<<<<<< HEAD
  // Tekil Ürün Kartı Bileşeni (Refactored)
  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      item={item}
      layout="grid"
      onPress={() => router.push(`/product/${item.id}` as any)}
      onAddToCart={(product) => addToCart(product)}
    />
  );

  return (
    <ScreenWrapper>
      {/* Üst Başlık */}
      <View className="px-4 py-3 flex-row justify-between items-center bg-white shadow-sm w-full">
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
=======
  // 1. HERO BÖLÜMÜ (Marka Tanıtımı)
  const HeroSection = () => (
    <View className="mb-8 rounded-3xl overflow-hidden shadow-lg mx-4 mt-4 h-64">
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop",
        }}
        className="flex-1 justify-center px-6 bg-gray-900"
        imageStyle={{ opacity: 0.7 }} // Resmi biraz karartıyoruz ki yazı okunsun
      >
        <Text className="text-amber-400 font-bold text-sm tracking-widest uppercase mb-2">
          Lupin Coffee Co.
        </Text>
        <Text className="text-white text-4xl font-extrabold mb-4 leading-tight">
          Güne Mükemmel{"\n"}Bir Başlangıç
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/two")} // Keşfet sayfasına yönlendir
          className="bg-amber-500 self-start px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Hemen Keşfet</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );

  // 2. HİKAYE BÖLÜMÜ
  const StorySection = () => (
    <View className="px-6 mb-10">
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        Bizim Hikayemiz
      </Text>
      <Text className="text-gray-600 text-center leading-6">
        Her şey bir çekirdekle başladı. Dünyanın en iyi kahve çiftliklerinden
        özenle seçtiğimiz çekirdekleri, geleneksel yöntemlerle modern
        teknolojiyi birleştirerek kavuruyoruz. Lupin Coffee olarak amacımız,
        bardağınıza sadece kahve değil, bir tutku hikayesi doldurmak.
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
          Organik
        </Text>
      </View>
      <View className="items-center">
        <View className="bg-white p-3 rounded-full shadow-sm mb-2">
          <Ionicons name="flame" size={24} color="#78350f" />
        </View>
        <Text className="font-bold text-gray-800 text-xs uppercase">
          Taze Kavrum
        </Text>
      </View>
      <View className="items-center">
        <View className="bg-white p-3 rounded-full shadow-sm mb-2">
          <Ionicons name="rocket" size={24} color="#78350f" />
        </View>
        <Text className="font-bold text-gray-800 text-xs uppercase">
          Hızlı Kargo
        </Text>
      </View>
    </View>
  );

  // 4. ÜRÜN KARTI (Yatay Carousel İçin)
  const renderCarouselItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => router.push(`/product/${item.id}` as any)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mr-4 mb-2 w-48"
    >
      <Image
        source={{ uri: item.images[0] }}
        className="w-full h-48 object-cover bg-gray-100"
      />
      <View className="p-3">
        <Text
          className="text-gray-900 font-bold text-sm mb-1"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="text-gray-500 text-xs mb-2" numberOfLines={1}>
          {item.category}
        </Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-amber-800 font-bold text-sm">
            {item.price} ₺
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Karta tıklamayı engelle, sadece sepete at
              addToCart(item);
            }}
            className="bg-amber-100 p-2 rounded-full"
          >
            <Ionicons name="add" size={16} color="#78350f" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      <SafeAreaView style={containerStyle}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Header Kısmı (Basit Logo/İsim) */}
          <View className="px-6 py-4 flex-row justify-between items-center bg-white shadow-sm z-10 sticky top-0">
            <Text className="text-amber-900 font-bold text-xl tracking-tight">
              Lupin Coffee.
>>>>>>> 94bc014128e0a6e78ca63ca4fae5bae45c77b4e5
            </Text>
            {/* Profil veya Sepet ikonu eklenebilir */}
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
                Çok Satanlar
              </Text>
              <TouchableOpacity onPress={() => router.push("/two")}>
                <Text className="text-amber-800 font-bold text-sm">
                  Tümünü Gör
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#78350f" />
            ) : (
              <FlatList
                horizontal
                data={products.slice(0, 5)} // Sadece ilk 5 ürünü göster
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

          {/* Ekstra Vitrin (Örneğin: Ekipmanlar) */}
          <View className="px-4 mt-6">
            <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-xl font-bold text-gray-800">
                Sizin İçin Seçtiklerimiz
              </Text>
            </View>
<<<<<<< HEAD
          }
        />
      )}
    </ScreenWrapper>
=======
            {loading ? (
              <ActivityIndicator color="#78350f" />
            ) : (
              <FlatList
                horizontal
                // Listeyi ters çevirip farklı ürünler gösterelim
                data={[...products].reverse().slice(0, 5)}
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
      </SafeAreaView>
    </View>
>>>>>>> 94bc014128e0a6e78ca63ca4fae5bae45c77b4e5
  );
}
