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
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { sendPushNotification } from "../../utils/sendNotification";

const CARD_WIDTH_WEB = 350;

export default function AdminOrdersScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  // ScreenWrapper max-width is 1200. We must use clamped width for column calc.
  const containerWidth = Math.min(width, 1200);
  const numColumns = isLargeScreen ? Math.floor(containerWidth / (CARD_WIDTH_WEB + 20)) : 1;

  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Filters
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });

  useEffect(() => {
    setLoading(true);
    // Query Logic (Active vs Archive)
    const statusIn = activeTab === "active" ? ["pending", "preparing", "shipped"] : ["delivered", "cancelled"];
    const sortOrder = activeTab === "active" ? "asc" : "desc";

    const q = query(
        collection(db, "orders"),
        where("status", "in", statusIn),
        orderBy("createdAt", sortOrder)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, (err) => {
        console.error("Orders Listener Error:", err);
        setLoading(false); 
    });

    return unsubscribe;
  }, [activeTab]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const date = new Date(order.createdAt?.seconds * 1000 || 0).toISOString().split("T")[0];
      const matchesSearch = 
        !searchQuery || 
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.address?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesStartDate = !filters.startDate || date >= filters.startDate;
      const matchesEndDate = !filters.endDate || date <= filters.endDate;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [orders, searchQuery, statusFilter, filters]);

  // Actions
  const handleShipOrder = async () => {
    if (!selectedOrderId || !trackingUrl) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrderId), { status: "shipped", trackingUrl, updatedAt: Date.now() });
      
      // SEND NOTIFICATION
      const order = orders.find(o => o.id === selectedOrderId);
      if (order && order.userId) {
          const userDoc = await getDoc(doc(db, "users", order.userId));
          if (userDoc.exists() && userDoc.data().pushToken) {
              await sendPushNotification(
                  userDoc.data().pushToken,
                  t('notifications.orderShippedTitle'),
                  t('notifications.orderShippedBody')
              );
          }
      }

      Toast.show({ type: "success", text1: t("adminOrders.toast.shipped.title") });
      setShippingModalVisible(false); setTrackingUrl("");
    } catch (e) { Toast.show({ type: "error", text1: t("common.error") }); }
  };

  const handleDeliverOrder = async (id: string) => {
      try { await updateDoc(doc(db, "orders", id), { status: "delivered", deliveredAt: Date.now() }); } catch(e) {}
  };
  const handleCancelOrder = async (id: string) => {
      try { await updateDoc(doc(db, "orders", id), { status: "cancelled", cancelledAt: Date.now() }); } catch(e) {}
  };

  // --- UI COMPONENTS ---
  const StatusBadge = ({ status }: { status: string }) => {
      let colorClass = "bg-gray-100 text-gray-800";
      if (status === 'pending') colorClass = "bg-amber-100 text-amber-800";
      else if (status === 'shipped') colorClass = "bg-blue-100 text-blue-800";
      else if (status === 'delivered') colorClass = "bg-green-100 text-green-800";
      else if (status === 'cancelled') colorClass = "bg-red-100 text-red-800";
      
      return (
          <View className={`px-2 py-1 rounded-md ${colorClass.split(" ")[0]}`}>
              <Text className={`text-xs font-bold uppercase ${colorClass.split(" ")[1]}`}>{t(`orders.status.${status}`)}</Text>
          </View>
      )
  };

  const renderOrderCard = ({ item }: { item: any }) => (
    <View style={isLargeScreen ? { width: CARD_WIDTH_WEB, margin: 10 } : { marginBottom: 16 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <View className="flex-row justify-between items-center p-4 bg-gray-50/50 border-b border-gray-100">
            <View>
                <Text className="text-gray-900 font-bold text-sm">#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text className="text-gray-400 text-xs">
                     {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : ''}
                </Text>
            </View>
            <StatusBadge status={item.status} />
        </View>
        
        {/* Items Summary */}
        <View className="p-4">
             <View className="mb-4">
                 {item.items?.slice(0, 3).map((line: any, i: number) => (
                     <Text key={i} className="text-gray-600 text-xs mb-1" numberOfLines={1}>• {line.quantity}x {line.title}</Text>
                 ))}
                 {item.items?.length > 3 && <Text className="text-gray-400 text-xs italic">... +{item.items.length - 3} more</Text>}
             </View>
             
             {/* Customer Info */}
             <View className="flex-row items-center mb-4">
                 <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                     <Ionicons name="person" size={14} color="#6b7280" />
                 </View>
                 <View className="flex-1">
                     <Text className="text-gray-900 font-medium text-xs">{item.address?.title || item.userEmail}</Text>
                     <Text className="text-gray-400 text-[10px]">{item.address?.city} / {item.address?.district}</Text>
                 </View>
                 <Text className="text-gray-900 font-bold text-lg">{item.totalAmount} ₺</Text>
             </View>

             {/* Actions */}
             {activeTab === "active" && (
                 <View className="flex-row space-x-2 pt-2 border-t border-gray-100">
                     {item.status === 'pending' && (
                        <>
                             <TouchableOpacity onPress={() => { setSelectedOrderId(item.id); setShippingModalVisible(true); }} className="flex-1 bg-blue-600 py-2 rounded-lg items-center">
                                 <Text className="text-white text-xs font-bold">{t('adminOrders.markAsShipped')}</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={() => handleCancelOrder(item.id)} className="bg-red-50 p-2 rounded-lg">
                                 <Ionicons name="trash-outline" size={16} color="#dc2626" />
                             </TouchableOpacity>
                        </>
                     )}
                     {item.status === 'shipped' && (
                         <TouchableOpacity onPress={() => handleDeliverOrder(item.id)} className="flex-1 bg-green-600 py-2 rounded-lg items-center">
                             <Text className="text-white text-xs font-bold">{t('adminOrders.markAsDelivered')}</Text>
                         </TouchableOpacity>
                     )}
                 </View>
             )}
             
             {item.trackingUrl && (
                 <TouchableOpacity onPress={() => Linking.openURL(item.trackingUrl)} className="mt-2 flex-row items-center justify-center">
                      <Ionicons name="link" size={14} color="#2563eb" />
                      <Text className="text-blue-600 text-xs ml-1 underline">{t("adminOrders.trackingUrl")}</Text>
                 </TouchableOpacity>
             )}
        </View>
    </View>
  );

  return (
    <ScreenWrapper>
        {/* Header Title */}
        <View className="px-4 py-4">
            <Text className="text-2xl font-bold text-gray-900">{t('adminOrders.title')}</Text>
        </View>

        {/* Custom Pill Tabs */}
        <View className="px-4 flex-row mb-4">
            <View className="flex-1 flex-row bg-gray-100 p-1 rounded-xl">
                <TouchableOpacity 
                    onPress={() => setActiveTab('active')} 
                    className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'active' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`text-xs font-bold ${activeTab === 'active' ? 'text-gray-900' : 'text-gray-500'}`}>{t('adminOrders.activeOrders')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('archive')} 
                    className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'archive' ? 'bg-white shadow-sm' : ''}`}
                >
                     <Text className={`text-xs font-bold ${activeTab === 'archive' ? 'text-gray-900' : 'text-gray-500'}`}>{t('adminOrders.archive')}</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Search & Filter Bar */}
        <View className="px-4 mb-4">
             <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-3">
                 <Ionicons name="search" size={20} color="#9ca3af" />
                 <TextInput 
                     value={searchQuery} onChangeText={setSearchQuery} 
                     placeholder={t('adminOrders.filter')} 
                     className="flex-1 ml-2 text-gray-800 text-sm" 
                 />
             </View>
             
             {/* Status Chips */}
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                 {['all', ...(activeTab ==='active'? ['pending','shipped'] : ['delivered','cancelled'])].map(status => (
                     <TouchableOpacity 
                        key={status} 
                        onPress={() => setStatusFilter(status)}
                        className={`px-4 py-1.5 rounded-full border mr-2 ${statusFilter === status ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}
                     >
                         <Text className={`text-xs font-bold ${statusFilter === status ? 'text-white' : 'text-gray-600'}`}>
                             {status === 'all' ? t('common.all') : t(`orders.status.${status}`)}
                         </Text>
                     </TouchableOpacity>
                 ))}
             </ScrollView>
        </View>

        {/* List */}
        {loading ? (
            <ActivityIndicator size="large" color="#78350f" className="mt-10" />
        ) : (
            <FlatList
                key={isLargeScreen ? "grid" : "list"}
                data={filteredOrders}
                renderItem={renderOrderCard}
                className="flex-1"
                keyExtractor={item => item.id}
                numColumns={numColumns}
                columnWrapperStyle={isLargeScreen ? { justifyContent: "flex-start"} : undefined}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center mt-20">
                         <Ionicons name="documents-outline" size={48} color="#d1d5db" />
                         <Text className="text-gray-400 mt-2">{t('adminOrders.empty')}</Text>
                    </View>
                }
            />
        )}

        {/* Ship Modal */}
        <Modal visible={shippingModalVisible} transparent animationType="fade">
             <View className="flex-1 bg-black/50 justify-center items-center p-4">
                 <View className="bg-white w-full max-w-sm p-6 rounded-2xl">
                     <Text className="text-lg font-bold text-gray-900 mb-4">{t('adminOrders.enterTracking')}</Text>
                     <TextInput 
                        value={trackingUrl} onChangeText={setTrackingUrl} placeholder="https://..." 
                        className="bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4"
                     />
                     <View className="flex-row justify-end space-x-3">
                         <TouchableOpacity onPress={() => setShippingModalVisible(false)} className="px-4 py-2"><Text className="text-gray-500 font-bold">{t('common.cancel')}</Text></TouchableOpacity>
                         <TouchableOpacity onPress={handleShipOrder} className="bg-blue-600 px-4 py-2 rounded-lg"><Text className="text-white font-bold">{t('common.save')}</Text></TouchableOpacity>
                     </View>
                 </View>
             </View>
        </Modal>
    </ScreenWrapper>
  );
}
