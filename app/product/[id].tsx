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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: product.title,
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

        {/* Alt Bar (Fiyat ve Buton) */}
        <View className="p-4 border-t border-gray-100 flex-row items-center justify-between bg-white safe-area-bottom">
          <View>
            <Text className="text-gray-400 text-xs">Toplam Fiyat</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {product.price} {product.currency}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              addToCart(product);
            }}
            className="bg-amber-900 px-8 py-4 rounded-xl flex-row items-center"
          >
            <Ionicons
              name="cart"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-bold text-lg">Sepete Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
