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
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();

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

  // --- STATÜ EŞLEŞTİRME FONKSİYONU ---
  // DB'den gelen karmaşık metinleri temiz anahtarlara çevirir
  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase();

    if (s === "pending" || s === "sipariş alındı")
      return t("orders.status.pending");
    if (s === "preparing" || s === "hazırlanıyor")
      return t("orders.status.preparing");
    if (s === "shipped" || s === "kargolandı")
      return t("orders.status.shipped");
    if (s === "delivered" || s === "teslim edildi")
      return t("orders.status.delivered");

    return status; // Tanımsızsa olduğu gibi göster
  };

  // Statüye göre renk belirleme
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "delivered" || s === "teslim edildi") return "bg-green-500";
    if (s === "shipped" || s === "kargolandı") return "bg-blue-500";
    if (s === "cancelled") return "bg-red-500";
    return "bg-amber-500"; // pending, preparing vs.
  };

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

  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";
  const currencySymbol = t("common.currency") || "TL"; // Varsayılan TL

  return (
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-gray-100">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">
              {t("orders.detailTitle")}
            </Text>
          </View>

          <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
            {/* 1. Sipariş Durumu Kartı */}
            <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
              <Text className="text-gray-500 text-xs font-bold uppercase mb-1">
                {t("orders.orderNumber")}
              </Text>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                #{order.orderNumber}
              </Text>

              <View className="flex-row items-center mt-1">
                <View
                  className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(
                    order.status
                  )}`}
                />
                <Text className="font-bold text-gray-700 uppercase tracking-wide">
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>

            {/* 2. Ürünler Listesi */}
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
                    <Text
                      className="font-bold text-gray-800 text-base"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-1">
                      {item.category}
                    </Text>
                    <View className="flex-row justify-between items-end mt-1">
                      <Text className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded">
                        x{item.quantity}
                      </Text>
                      <Text className="font-bold text-amber-900">
                        {item.price * item.quantity} {currencySymbol}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Toplam Tutar Alanı */}
              <View className="flex-row justify-between mt-2 pt-3 border-t border-gray-100 items-center">
                <Text className="font-bold text-gray-600 text-base">
                  {t("orders.total")}
                </Text>
                <Text className="font-bold text-indigo-700 text-xl">
                  {order.totalAmount} {currencySymbol}
                </Text>
              </View>
            </View>

            {/* 3. Teslimat Bilgileri */}
            <View className="bg-white p-4 rounded-xl shadow-sm mb-10 border border-gray-100">
              <Text className="font-bold text-gray-800 mb-3 text-lg">
                {t("orders.shippingInfo")}
              </Text>

              <View className="flex-row items-start mb-3">
                <View className="bg-amber-50 p-2 rounded-full mr-3">
                  <Ionicons name="location" size={20} color="#78350f" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800 mb-1">
                    {order.address.title}
                  </Text>
                  <Text className="text-gray-600 leading-5 text-sm">
                    {order.address.fullAddress}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {order.address.district} / {order.address.city}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center border-t border-gray-50 pt-3">
                <View className="bg-blue-50 p-2 rounded-full mr-3">
                  <Ionicons name="call" size={20} color="#1d4ed8" />
                </View>
                <Text className="text-gray-700 font-bold">
                  {order.address.phone}
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}
