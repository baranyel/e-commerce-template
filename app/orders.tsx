import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
} from "react-native"; // Clipboard eklendi
// import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenWrapper } from "../components/ui/ScreenWrapper";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kullanıcı yoksa işlem yapma
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // SORGU: Benim ID'me sahip olanlar VE Tarihe göre tersten sırala
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Veri geldi mi bakalım?
        console.log(
          `Veri çekildi: ${snapshot.docs.length} adet sipariş bulundu.`
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        // --- HATA YAKALAMA ---
        console.error("Sipariş Çekme Hatası:", error);

        if (error.message.includes("index")) {
          Alert.alert(
            "Sistem Hatası: Index Eksik",
            "Firebase Console'da bu sorgu için Index oluşturulması gerekiyor. Link konsola yazıldı."
          );
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "shipped":
        return {
          color: "bg-blue-100",
          text: "text-blue-700",
          label: "orders.status.shipped",
        };
      case "delivered":
        return {
          color: "bg-green-100",
          text: "text-green-700",
          label: "orders.status.delivered",
        };
      case "cancelled":
        return {
          color: "bg-red-100",
          text: "text-red-700",
          label: "orders.status.cancelled",
        };
      default:
        return {
          color: "bg-amber-100",
          text: "text-amber-800",
          label: "orders.status.pending",
        };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // Tarih formatlama güvenliği
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("tr-TR")
      : "-";
    // Durum çevirisi için güvenli erişim
    const statusLabel = getStatusInfo(item.status).label;
    const translatedStatus =
      t(statusLabel) !== statusLabel ? t(statusLabel) : item.status;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/order-detail/${item.id}` as any)}
        className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-xs text-gray-500 font-bold uppercase">
              {t("orders.orderNumber")}
            </Text>
            <Text className="text-gray-900 font-bold text-base">
              #{item.orderNumber}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              getStatusInfo(item.status).color
            }`}
          >
            <Text
              className={`text-xs font-bold ${getStatusInfo(item.status).text}`}
            >
              {translatedStatus}
            </Text>
          </View>
        </View>

        <View className="h-[1px] bg-gray-100 my-2" />

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-400">
              {t("orders.orderDate")}
            </Text>
            <Text className="text-gray-600 text-sm">{date}</Text>
          </View>
          <View>
            <Text className="text-xs text-gray-400 text-right">
              {t("orders.total")}
            </Text>
            <Text className="text-amber-900 font-bold text-lg">
              {item.totalAmount} TL
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-gray-100 w-full">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">
          {t("orders.title")}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#78350f" className="mt-10" />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-400 mt-4">{t("orders.noOrders")}</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}
