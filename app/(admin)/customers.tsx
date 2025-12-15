import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  ActivityIndicator
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { UserProfile, Product, Order } from "../../types";

export default function CustomersScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<'spend' | 'recent'>('spend');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Fetch Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch All Orders (For aggregation)
    const unsubOrders = onSnapshot(query(collection(db, "orders")), (snapshot) => {
       setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
       setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  const aggregatedData = useMemo(() => {
     if (loading) return [];
     
     const customerMap = new Map<string, any>();

     // 1. Initialize with Registered Users
     users.forEach(user => {
         customerMap.set(user.id, {
             ...user,
             totalSpend: 0,
             orderCount: 0,
             isGhost: false
         });
     });

     // 2. Process Orders to update stats and find Ghost Users
     orders.forEach(order => {
         // Some legacy orders might not have userId, or it might be a guest checkout if you support that
         const userId = order.userId; 
         const totalAmount = parseFloat(String(order.totalAmount).replace(',','.')) || Number(order.totalAmount) || 0;
         const createdAt = order.createdAt;

         if (userId) {
             if (!customerMap.has(userId)) {
                 // Create Ghost User
                 customerMap.set(userId, {
                     id: userId,
                     fullName: order.address?.title || order.address?.fullName || order.userEmail || "Guest/Deleted User",
                     email: order.userEmail || "No Email",
                     totalSpend: 0,
                     orderCount: 0,
                     isGhost: true,
                 });
             }

             const customer = customerMap.get(userId);
             customer.totalSpend += totalAmount;
             customer.orderCount += 1;
             
             // Track Last Order Date
             const currentLast = customer.lastOrderDate?.seconds || 0;
             const newDate = createdAt?.seconds || 0;
             if (newDate > currentLast) {
                 customer.lastOrderDate = createdAt;
             }
         }
     });

     return Array.from(customerMap.values()).filter(c => c.orderCount > 0 || !c.isGhost);
  }, [users, orders, loading]);

  const filteredAndSortedUsers = useMemo(() => {
      let data = aggregatedData.filter(u => 
          (u.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
          (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (sortMode === 'spend') {
          data.sort((a, b) => b.totalSpend - a.totalSpend);
      } else {
          // Recent orders
          data.sort((a, b) => {
              const dateA = a.lastOrderDate?.seconds || 0;
              const dateB = b.lastOrderDate?.seconds || 0;
              return dateB - dateA;
          });
      }

      return data;
  }, [aggregatedData, searchQuery, sortMode]);

  const topSpenders = useMemo(() => {
      return [...aggregatedData].sort((a,b) => b.totalSpend - a.totalSpend).slice(0, 3);
  }, [aggregatedData]);

  const handleUserClick = async (user: any) => {
      setSelectedUser(user);
      setModalLoading(true);
      
      // Filter Orders from client state (more efficient since we have them)
      const uOrders = orders
        .filter(o => o.userId === user.id) // Use user.id
        .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 5);
      
      setUserOrders(uOrders);

      // Fetch Favorites dynamically
      try {
          const favRef = collection(db, "users", user.id, "favorites"); // Use user.id
          const favSnap = await getDocs(favRef);
          
          if (favSnap.empty) {
            setUserFavorites([]);
            return;
          }

          const favIds = favSnap.docs.map(d => d.id);
          
          const favPromises = favIds.map(id => getDoc(doc(db, "products", id)));
          const favDocs = await Promise.all(favPromises);
          
          setUserFavorites(
            favDocs
              .filter(d => d.exists())
              .map(d => ({id:d.id, ...d.data()}))
          );
      } catch (error) {
          console.error("Error fetching favorites for user modal", error);
          setUserFavorites([]);
      } finally {
          setModalLoading(false);
      }
  };

  const VipCard = ({ user, rank }: { user: any; rank: number }) => {
      if (!user) return null;
      const colors = rank === 1 ? 'bg-yellow-100 border-yellow-200 text-yellow-800' :
                     rank === 2 ? 'bg-gray-100 border-gray-200 text-gray-800' :
                     'bg-orange-100 border-orange-200 text-orange-800';
      
      return (
          <View className={`flex-1 p-3 rounded-xl border items-center mx-1 ${colors.split(' ')[0]} ${colors.split(' ')[1]}`}>
              <Ionicons name="trophy" size={20} color={rank === 1 ? '#ca8a04' : rank === 2 ? '#4b5563' : '#c2410c'} className="mb-2" />
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-2 shadow-sm">
                  <Text className="font-bold text-lg">{user.fullName?.[0] || user.email?.[0]}</Text>
              </View>
              <Text className="font-bold text-xs text-center" numberOfLines={1}>{user.fullName || "User"}</Text>
              <Text className={`font-bold mt-1 ${colors.split(' ')[2]}`}>{user.totalSpend} ₺</Text>
          </View>
      );
  };

  const renderUserRow = ({ item }: { item: any }) => (
      <TouchableOpacity onPress={() => handleUserClick(item)} className="flex-row items-center p-4 bg-white border-b border-gray-100">
          <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Text className="font-bold text-gray-600">{item.fullName?.[0] || "?"}</Text>
          </View>
          <View className="flex-1">
              <Text className="font-bold text-gray-900">{item.fullName || "Guest"}</Text>
              <Text className="text-gray-500 text-xs">{item.email}</Text>
          </View>
          
          <View className="items-end">
              <Text className="font-bold text-gray-900">{item.totalSpend} ₺</Text>
              <Text className="text-gray-400 text-xs">{item.orderCount} {t('crm.orders') || "Orders"}</Text>
          </View>
      </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
       <View className="flex-1">
           {/* Header */}
           <View className="px-5 pt-4 pb-2">
               <Text className="text-2xl font-bold text-gray-900">{t('crm.title') || "Customer Insights"}</Text>
           </View>

           {loading ? (
               <ActivityIndicator size="large" className="mt-10" color="#78350f" />
           ) : (
             <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
               {/* VIP Podium */}
               <View className="px-4 mb-6">
                   <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">{t('crm.vip') || "Top Spenders"}</Text>
                   <View className="flex-row justify-between">
                       <VipCard user={topSpenders[1]} rank={2} />
                       <VipCard user={topSpenders[0]} rank={1} />
                       <VipCard user={topSpenders[2]} rank={3} />
                   </View>
               </View>

               {/* Controls */}
               <View className="px-4 mb-4 flex-row space-x-2">
                   <View className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-row items-center shadow-sm">
                       <Ionicons name="search" size={18} color="#9ca3af" />
                       <TextInput 
                          placeholder={t('customers.searchPlaceholder') || "Search..."}
                          className="flex-1 ml-2 text-sm"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                       />
                   </View>
                   <TouchableOpacity 
                      onPress={() => setSortMode(sortMode === 'spend' ? 'recent' : 'spend')}
                      className="bg-white border border-gray-200 rounded-xl px-3 items-center justify-center shadow-sm"
                   >
                       <Ionicons name={sortMode === 'spend' ? "cash-outline" : "time-outline"} size={20} color="#4b5563" />
                   </TouchableOpacity>
               </View>

               {/* Customer List */}
               <View className="flex-1 px-4">
                   <FlatList 
                      data={filteredAndSortedUsers}
                      renderItem={renderUserRow}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                   />
               </View>
             </ScrollView>
           )}

           {/* User Detail Modal */}
           <Modal 
              visible={!!selectedUser} 
              animationType="slide" 
              presentationStyle="pageSheet"
              onRequestClose={() => setSelectedUser(null)}
            >
               <View className="flex-1 bg-gray-50">
                  <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
                      <Text className="text-lg font-bold">{t('crm.customerDetail') || "Customer Profile"}</Text>
                      <TouchableOpacity onPress={() => setSelectedUser(null)} className="bg-gray-100 p-2 rounded-full">
                          <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                  </View>
                  
                  {selectedUser && (
                     <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 50 }}>
                         {/* Profile Header */}
                         <View className="bg-white rounded-2xl p-6 items-center shadow-sm border border-gray-100 mb-6">
                             <View className="w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-3">
                                <Text className="text-3xl font-bold text-amber-800">{selectedUser.fullName?.[0]}</Text>
                             </View>
                             <Text className="text-xl font-bold text-gray-900">{selectedUser.fullName}</Text>
                             <Text className="text-gray-500 mb-4">{selectedUser.email}</Text>
                             
                             <View className="flex-row w-full justify-between border-t border-gray-100 pt-4">
                                 <View className="items-center flex-1 border-r border-gray-100">
                                     <Text className="text-gray-400 text-xs uppercase">{t('crm.ltv') || "Total Spend"}</Text>
                                     <Text className="text-lg font-bold text-gray-900">{selectedUser.totalSpend} ₺</Text>
                                 </View>
                                 <View className="items-center flex-1">
                                     <Text className="text-gray-400 text-xs uppercase">{t('crm.orders') || "Orders"}</Text>
                                     <Text className="text-lg font-bold text-gray-900">{selectedUser.orderCount}</Text>
                                 </View>
                             </View>
                         </View>

                         {/* Last 5 Orders */}
                         <Text className="font-bold text-gray-700 mb-2 ml-1">{t('crm.lastOrders') || "Recent Orders"}</Text>
                         {userOrders.map((order: any) => (
                             <View key={order.id} className="bg-white p-4 rounded-xl mb-2 flex-row justify-between items-center border border-gray-100 shadow-sm">
                                 <View>
                                     <Text className="font-bold text-gray-900">Order #{order.id.slice(0,6)}</Text>
                                     <Text className="text-xs text-gray-500">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</Text>
                                 </View>
                                 <View className={`px-2 py-1 rounded-md ${order.status === 'delivered' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                     <Text className={`text-xs font-bold ${order.status === 'delivered' ? 'text-green-700' : 'text-yellow-700'}`}>{order.status}</Text>
                                 </View>
                                 <Text className="font-bold">{order.totalAmount} ₺</Text>
                             </View>
                         ))}
                         {userOrders.length === 0 && <Text className="text-gray-400 text-center mb-6">No orders found.</Text>}

                         {/* Favorites */}
                         <Text className="font-bold text-gray-700 mb-2 ml-1 mt-4">{t('crm.favorites') || "Favorites"}</Text>
                         {modalLoading ? <ActivityIndicator color="#78350f" /> : (
                             <View className="flex-row flex-wrap">
                                 {userFavorites.map((fav: any) => (
                                     <View key={fav.id} className="w-[31%] mr-[2%] mb-2 bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                                         <Image source={{ uri: fav.images?.[0] }} className="w-full h-20 rounded-md bg-gray-100 mb-2" />
                                         <Text numberOfLines={1} className="text-xs font-bold">{fav.title}</Text>
                                         <Text className="text-xs text-amber-700">{fav.price} ₺</Text>
                                     </View>
                                 ))}
                                 {userFavorites.length === 0 && <Text className="text-gray-400 text-center w-full">No favorites found.</Text>}
                             </View>
                         )}
                     </ScrollView>
                  )}
               </View>
           </Modal>
       </View>
    </ScreenWrapper>
  );
}
