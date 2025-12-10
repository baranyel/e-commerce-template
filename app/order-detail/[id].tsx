import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading)
    return (
      <View className="flex-1 bg-white justify-center">
        <ActivityIndicator color="#78350f" />
      </View>
    );
  if (!order)
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text>Sipariş bulunamadı.</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">
          {t("orders.detailTitle")}
        </Text>
      </View>

      <ScrollView className="p-4">
        {/* Sipariş Durumu Kartı */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-bold uppercase mb-1">
            {t("orders.orderNumber")}
          </Text>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            #{order.orderNumber}
          </Text>
          <View className="flex-row items-center">
            <View
              className={`w-3 h-3 rounded-full mr-2 ${
                order.status === "pending" ? "bg-amber-500" : "bg-green-500"
              }`}
            />
            <Text className="font-bold text-gray-600 uppercase">
              {t(`orders.status.${order.status}`)}
            </Text>
          </View>
        </View>

        {/* Ürünler Listesi */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
          <Text className="font-bold text-gray-800 mb-4 text-lg">
            {t("orders.items")}
          </Text>
          {order.items.map((item: any, index: number) => (
            <View
              key={index}
              className="flex-row mb-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0"
            >
              <Image
                source={{ uri: item.images[0] }}
                className="w-16 h-16 rounded-lg bg-gray-100"
              />
              <View className="flex-1 ml-3 justify-center">
                <Text className="font-bold text-gray-800" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-gray-500 text-xs">{item.category}</Text>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-600 text-xs">
                    {item.quantity} adet
                  </Text>
                  <Text className="font-bold text-amber-900">
                    {item.price * item.quantity} TL
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
            <Text className="font-bold text-gray-900">{t("orders.total")}</Text>
            <Text className="font-bold text-amber-900 text-lg">
              {order.totalAmount} TL
            </Text>
          </View>
        </View>

        {/* Teslimat Bilgileri */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-10 border border-gray-100">
          <Text className="font-bold text-gray-800 mb-3 text-lg">
            {t("orders.shippingInfo")}
          </Text>
          <View className="flex-row items-start mb-2">
            <Ionicons name="location-outline" size={20} color="#78350f" />
            <Text className="ml-2 text-gray-600 flex-1 leading-5">
              <Text className="font-bold text-gray-800">
                {order.address.title}
              </Text>
              {"\n"}
              {order.address.fullAddress}
              {"\n"}
              {order.address.district} / {order.address.city}
            </Text>
          </View>
          <View className="flex-row items-center mt-2">
            <Ionicons name="call-outline" size={20} color="#78350f" />
            <Text className="ml-2 text-gray-600 font-bold">
              {order.address.phone}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
