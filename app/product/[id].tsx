import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { useCart } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";

import { useTranslation } from "react-i18next";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();

  // Renk Ayarları
  // Dış taraf (Boşluklar): Açık modda Gri (#F3F4F6), Koyu modda Tam Siyah
  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";

  // İç taraf (İçerik): Açık modda Beyaz, Koyu modda Koyu Gri/Siyah
  const innerBackgroundColor = Colors[colorScheme ?? "light"].background;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct(docSnap.data() as Product);
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#78350f" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Ürün bulunamadı.</Text>
      </View>
    );
  }
  const isOutOfStock = product.stock <= 0;
  return (
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          // Web'de kenarlarda gölge olsun istersen bunu açabilirsin:
          // shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
        }}
      >
        {" "}
        <Stack.Screen
          options={{
            headerShown: true,
            title: product.title + " | Lupin Coffee",
            headerTintColor: "#000",
            headerBackTitle: "Geri",
          }}
        />
        <View className="flex-1 bg-white">
          <ScrollView>
            <Image
              source={{ uri: product.images[0] }}
              className="w-full h-80 object-cover"
            />
            <View className="p-6">
              <Text className="text-amber-800 text-sm font-bold uppercase tracking-wider mb-2">
                {product.category}
              </Text>
              <Text className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </Text>
              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                {product.description}
              </Text>
            </View>
          </ScrollView>

          {/* Alt Bar */}
          <View className="p-4 border-t border-gray-100 flex-row items-center justify-between bg-white safe-area-bottom">
            <View>
              <Text className="text-gray-400 text-xs">{t("product.totalPrice")}</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {product.price} {product.currency}
              </Text>
              {/* Stok Bilgisi Göster */}
              {isOutOfStock ? (
                <Text className="text-red-600 text-xs font-bold mt-1">
                  {t("product.outOfStock")}
                </Text>
              ) : (
                <Text className="text-gray-500 text-xs mt-1">
                  {t("product.stock")}: {product.stock}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => addToCart(product)}
              disabled={isOutOfStock} // Stok yoksa tıklanmasın
              className={`px-8 py-4 rounded-xl flex-row items-center ${isOutOfStock ? "bg-gray-300" : "bg-amber-900" // Stok yoksa gri, varsa kahve rengi
                }`}
            >
              <Ionicons
                name="cart"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-bold text-lg">
                {isOutOfStock ? t("product.outOfStock") : t("product.addToCart")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
