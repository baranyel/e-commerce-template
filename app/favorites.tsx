import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenWrapper } from "../components/ui/ScreenWrapper";
import { useFavorites } from "../hooks/useFavorites";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Product } from "../types";
import { ProductCard } from "../components/ui/ProductCard";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import Toast from "react-native-toast-message";

export default function FavoritesScreen() {
  const { favoriteIds } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const router = useRouter();

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      if (favoriteIds.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      try {
        const productPromises = favoriteIds.map(id => getDoc(doc(db, "products", id)));
        const productDocs = await Promise.all(productPromises);
        
        const products = productDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as Product));

        setFavoriteProducts(products);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteIds]);

  const handleAddToCart = (item: Product) => {
      addToCart(item);
      Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('favorites.addedToCart') || "Sepete eklendi" 
      });
  };

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard 
      item={item} 
      layout="grid" 
      containerStyle={{ flex: 0.5, maxWidth: "47%" }} 
      onPress={() => router.push(`/product/${item.id}`)}
      onAddToCart={handleAddToCart}
    />
  );

  return (
    <ScreenWrapper>
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="mb-6 mt-2 flex-row items-center border-b border-gray-100 pb-4">
             <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#1f2937" />
             </TouchableOpacity>
             <Text className="text-2xl font-bold text-gray-900">{t('favorites.title') || "Favorilerim"}</Text>
        </View>

        {loading ? (
             <ActivityIndicator size="large" color="#78350f" className="mt-10" />
        ) : favoriteProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center -mt-20">
                <View className="bg-gray-100 w-32 h-32 rounded-full items-center justify-center mb-6">
                    <Ionicons name="heart-dislike-outline" size={60} color="#9ca3af" />
                </View>
                <Text className="text-xl font-bold text-gray-800 mb-2">{t('favorites.emptyTitle') || "Listeniz Boş"}</Text>
                <Text className="text-gray-500 text-center mb-8 px-8">
                    {t('favorites.emptySubtitle') || "Henüz favori ürün eklemediniz."}
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push("/(tabs)/")}
                    className="bg-amber-900 px-8 py-4 rounded-xl shadow-md"
                >
                    <Text className="text-white font-bold">{t('favorites.startShopping') || "Alışverişe Başla"}</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <FlatList
                data={favoriteProducts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        )}
      </View>
    </ScreenWrapper>
  );
}
