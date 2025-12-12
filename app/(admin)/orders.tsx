import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

// Responsive Tasarım için Kart Genişliği Ayarı
const CARD_WIDTH_WEB = 350; // Web'de kart genişliği

export default function AdminOrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Responsive Kontrolü: Genişlik 768px'den büyükse Web/Tablet modudur
  const isLargeScreen = width > 768;
  const numColumns = isLargeScreen
    ? Math.floor(width / (CARD_WIDTH_WEB + 20))
    : 1;

  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Kargo Modal State'leri
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState("");

  // Filtre State'leri (Arşiv için)
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    // Tarih filtresi için basit string kullanıyoruz (YYYY-MM-DD)
    startDate: "",
    endDate: "",
  });

  // VERİ ÇEKME (CANLI)
  useEffect(() => {
    setLoading(true);
    let q;

    if (activeTab === "active") {
      // AKTİF: Bekleyen ve Kargolananlar.
      // SIRALAMA: 'asc' (Eskiden Yeniye) -> İLK SİPARİŞ VERENİN HAKKI YENMESİN!
      q = query(
        collection(db, "orders"),
        where("status", "in", ["pending", "shipped"]),
        orderBy("createdAt", "asc")
      );
    } else {
      // ARŞİV: Teslim edilen ve İptaller.
      // SIRALAMA: 'desc' (Yeniden Eskiye) -> Son biteni başta görelim
      q = query(
        collection(db, "orders"),
        where("status", "in", ["delivered", "cancelled"]),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Sipariş çekme hatası:", error);
        // Index hatası verirse console'a link düşer, ona tıkla.
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [activeTab]);

  // ARŞİV FİLTRELEME MANTIĞI (Client-Side)
  const filteredOrders = useMemo(() => {
    if (activeTab === "active") return orders;

    return orders.filter((order) => {
      const price = order.totalAmount;
      const date = new Date(order.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD

      // Fiyat Filtresi
      if (filters.minPrice && price < parseFloat(filters.minPrice))
        return false;
      if (filters.maxPrice && price > parseFloat(filters.maxPrice))
        return false;

      // Tarih Filtresi
      if (filters.startDate && date < filters.startDate) return false;
      if (filters.endDate && date > filters.endDate) return false;

      return true;
    });
  }, [orders, filters, activeTab]);

  // DURUM GÜNCELLEME FONKSİYONLARI
  const handleShipOrder = async () => {
    if (!selectedOrderId || !trackingUrl) return;

    try {
      await updateDoc(doc(db, "orders", selectedOrderId), {
        status: "shipped",
        trackingUrl: trackingUrl,
        updatedAt: Date.now(),
      });
      Toast.show({
        type: "success",
        text1: "Kargolandı",
        text2: "Sipariş kargoya verildi.",
      });
      setShippingModalVisible(false);
      setTrackingUrl("");
    } catch (error) {
      Toast.show({ type: "error", text1: "Hata", text2: "İşlem başarısız." });
    }
  };

  const handleDeliverOrder = async (id: string) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "delivered",
        deliveredAt: Date.now(),
      });
      Toast.show({
        type: "success",
        text1: "Tamamlandı",
        text2: "Sipariş arşive taşındı.",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelOrder = async (id: string) => {
    // Burada stokları geri iade etme mantığı da eklenebilir
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "cancelled",
        cancelledAt: Date.now(),
      });
      Toast.show({
        type: "info",
        text1: "İptal",
        text2: "Sipariş iptal edildi.",
      });
    } catch (error) {
      console.error(error);
    }
  };

  // KART BİLEŞENİ
  const renderOrderCard = ({ item }: { item: any }) => {
    const date = new Date(item.createdAt).toLocaleString("tr-TR");

    return (
      <View
        style={
          isLargeScreen
            ? { width: CARD_WIDTH_WEB, margin: 10 }
            : { marginBottom: 16 }
        }
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Header: No ve Tarih */}
        <View className="bg-gray-50 p-3 border-b border-gray-100 flex-row justify-between items-center">
          <View>
            <Text className="text-xs font-bold text-gray-500">
              #{item.orderNumber}
            </Text>
            <Text className="text-xs text-gray-400">{date}</Text>
          </View>
          <View
            className={`px-2 py-1 rounded text-xs font-bold ${
              item.status === "pending"
                ? "bg-amber-100 text-amber-800"
                : item.status === "shipped"
                ? "bg-blue-100 text-blue-800"
                : item.status === "delivered"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <Text className="text-xs font-bold capitalize">
              {t(`orders.status.${item.status}`)}
            </Text>
          </View>
        </View>

        {/* İçerik */}
        <View className="p-4">
          {/* Müşteri Bilgileri */}
          <View className="mb-3">
            <Text className="text-gray-900 font-bold text-sm mb-1">
              {item.address.title} ({item.userEmail})
            </Text>
            <Text className="text-gray-500 text-xs leading-4">
              {item.address.fullAddress}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              {item.address.city} / {item.address.district}
            </Text>
            <Text
              className="text-blue-600 text-xs font-bold mt-1"
              onPress={() => Linking.openURL(`tel:${item.address.phone}`)}
            >
              📞 {item.address.phone}
            </Text>
          </View>

          {/* Ürün Özeti */}
          <View className="bg-gray-50 p-2 rounded-lg mb-3">
            {item.items.map((prod: any, idx: number) => (
              <Text
                key={idx}
                className="text-xs text-gray-700"
                numberOfLines={1}
              >
                • {prod.quantity}x {prod.title}
              </Text>
            ))}
            <View className="mt-2 pt-2 border-t border-gray-200 flex-row justify-between">
              <Text className="text-xs font-bold text-gray-600">
                {t("adminOrders.items")}: {item.items.length}
              </Text>
              <Text className="text-sm font-bold text-amber-900">
                {item.totalAmount} TL
              </Text>
            </View>
          </View>

          {/* Aksiyon Butonları (Sadece Aktif Sekmesinde) */}
          {activeTab === "active" && (
            <View className="flex-row space-x-2">
              {item.status === "pending" && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedOrderId(item.id);
                      setShippingModalVisible(true);
                    }}
                    className="flex-1 bg-blue-600 py-2 rounded-lg items-center"
                  >
                    <Text className="text-white text-xs font-bold">
                      {t("adminOrders.markAsShipped")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCancelOrder(item.id)}
                    className="bg-red-100 px-3 py-2 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="close" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </>
              )}

              {item.status === "shipped" && (
                <TouchableOpacity
                  onPress={() => handleDeliverOrder(item.id)}
                  className="flex-1 bg-green-600 py-2 rounded-lg items-center"
                >
                  <Text className="text-white text-xs font-bold">
                    {t("adminOrders.markAsDelivered")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Kargo Takip Linki (Varsa) */}
          {item.trackingUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.trackingUrl)}
              className="mt-2 flex-row items-center justify-center"
            >
              <Ionicons name="link" size={14} color="#2563eb" />
              <Text className="text-blue-600 text-xs ml-1 underline">
                {t("adminOrders.trackingUrl")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Üst Bar (Tablar) */}
      <View className="bg-white p-2 flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("active")}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === "active" ? "border-amber-900" : "border-transparent"
          }`}
        >
          <Text
            className={`font-bold ${
              activeTab === "active" ? "text-amber-900" : "text-gray-500"
            }`}
          >
            {t("adminOrders.activeOrders")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("archive")}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === "archive" ? "border-amber-900" : "border-transparent"
          }`}
        >
          <Text
            className={`font-bold ${
              activeTab === "archive" ? "text-amber-900" : "text-gray-500"
            }`}
          >
            {t("adminOrders.archive")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Arşiv Filtreleri (Sadece Arşiv Sekmesinde) */}
      {activeTab === "archive" && (
        <View className="bg-white p-2 border-b border-gray-200 flex-row flex-wrap items-center gap-2">
          <TextInput
            placeholder={t("adminOrders.minPrice")}
            value={filters.minPrice}
            onChangeText={(t) => setFilters({ ...filters, minPrice: t })}
            keyboardType="numeric"
            className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs w-24"
          />
          <TextInput
            placeholder={t("adminOrders.maxPrice")}
            value={filters.maxPrice}
            onChangeText={(t) => setFilters({ ...filters, maxPrice: t })}
            keyboardType="numeric"
            className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs w-24"
          />
          <TextInput
            placeholder="YYYY-MM-DD"
            value={filters.startDate}
            onChangeText={(t) => setFilters({ ...filters, startDate: t })}
            className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs w-28"
          />
          <TouchableOpacity
            onPress={() =>
              setFilters({
                minPrice: "",
                maxPrice: "",
                startDate: "",
                endDate: "",
              })
            }
          >
            <Ionicons name="refresh-circle" size={24} color="#78350f" />
          </TouchableOpacity>
        </View>
      )}

      {/* Sipariş Listesi (Responsive Grid/List) */}
      {loading ? (
        <ActivityIndicator size="large" color="#78350f" className="mt-10" />
      ) : (
        <FlatList
          key={isLargeScreen ? "grid" : "list"} // Layout değişince re-render
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          numColumns={numColumns} // Web'de yan yana, mobilde 1
          columnWrapperStyle={
            isLargeScreen ? { justifyContent: "flex-start" } : undefined
          } // Grid hizalama
          contentContainerStyle={{ padding: 10 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-gray-400">Sipariş bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Kargo Takip Modalı */}
      <Modal visible={shippingModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-sm p-6 rounded-2xl">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              {t("adminOrders.enterTracking")}
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              {t("adminOrders.enterTrackingDesc")}
            </Text>

            <TextInput
              placeholder={t("adminOrders.trackingUrlPlaceholder")}
              value={trackingUrl}
              onChangeText={setTrackingUrl}
              className="bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4"
              autoFocus
            />

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setShippingModalVisible(false)}
                className="px-4 py-2"
              >
                <Text className="text-gray-500 font-bold">
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShipOrder}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-bold">{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
