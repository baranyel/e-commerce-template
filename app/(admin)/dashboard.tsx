import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { LineChart } from "react-native-chart-kit";

// Types
interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: any; // Firestore Timestamp
  userId: string;
  items: any[];
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setOrders(data);
    });

    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(data);
      if (loading) setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  // --- LOGIC & STATS ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Revenue
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    
    // Today's Revenue
    const todayRevenue = deliveredOrders.reduce((sum, o) => {
        const orderDate = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : 0;
        return orderDate >= todayStart ? sum + Number(o.totalAmount) : sum;
    }, 0);

    // Active Orders
    const activeOrdersCount = orders.filter(o => ['pending', 'preparing', 'shipped'].includes(o.status)).length;

    // Total Users (Unique User IDs)
    const uniqueUsers = new Set(orders.map(o => o.userId)).size;

    // Low Stock
    const lowStockCount = products.filter(p => p.stock < 5).length;

    // Product Lookup Map for Images
    const productMap = new Map(products.map(p => [p.id, p]));

    // Top Selling Products
    const productSales: Record<string, { count: number, title: string, image: string }> = {};
    orders.forEach(order => {
        if (order.status !== 'cancelled') {
            order.items?.forEach((item: any) => {
                const liveProduct = productMap.get(item.id);
                // Try order item image -> live product image -> placeholder
                const image = item.image || item.images?.[0] || liveProduct?.images?.[0] || "https://via.placeholder.com/150";
                
                if (!productSales[item.id]) {
                    productSales[item.id] = { count: 0, title: item.title, image };
                }
                productSales[item.id].count += item.quantity || 1;
            });
        }
    });
    const topSelling = Object.values(productSales)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Recent Activity (Last 5 orders)
    const recentActivity = orders.slice(0, 5);

    return {
        totalRevenue,
        todayRevenue,
        activeOrdersCount,
        uniqueUsers,
        lowStockCount,
        topSelling,
        recentActivity
    };
  }, [orders, products]);

  // --- UI COMPONENTS ---
  
  const StatCard = ({ title, value, subValue, icon, color, bgColor }: any) => (
    <View className="w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-50">
        <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${bgColor}`}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text className="text-gray-500 text-xs font-medium mb-1">{title}</Text>
        <Text className="text-gray-900 text-lg font-bold">{value}</Text>
        {subValue && <Text className="text-xs text-green-600 mt-1 font-medium">{subValue}</Text>}
    </View>
  );

  // ... QuickAction Component
  const QuickAction = ({ title, icon, onPress }: any) => {
      const isDesktop = screenWidth > 768;
      // Removed aspect-square, added fixed height/min-height constraints for text flow
      return (
        <TouchableOpacity 
            onPress={onPress}
            style={{ width: isDesktop ? '23%' : '48%' }}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center justify-center mb-4 min-h-[110px]"
        >
            <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mb-2">
                 <Ionicons name={icon} size={22} color="#d97706" />
            </View>
            <Text className="text-gray-700 font-bold text-xs text-center leading-tight" numberOfLines={2} ellipsizeMode="tail">{title}</Text>
        </TouchableOpacity>
      );
  };

  if (loading) {
    return (
        <ScreenWrapper>
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#78350f" />
            </View>
        </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Header */}
            <View className="px-5 pt-6 pb-4">
                <Text className="text-2xl font-bold text-gray-900">{t('adminPanel')}</Text>
                <Text className="text-gray-500 text-sm mt-1">{t('admin.dashboard.todaysRevenue')}: <Text className="text-green-600 font-bold">{stats.todayRevenue.toLocaleString()} ₺</Text></Text>
            </View>

            {/* A. Stat Cards (Grid) */}
            <View className="px-5 flex-row flex-wrap justify-between">
                <StatCard 
                    title={t('admin.dashboard.totalRevenue')} 
                    value={`${stats.totalRevenue.toLocaleString()} ₺`}
                    icon="wallet" 
                    color="#059669" // green-600
                    bgColor="bg-green-50"
                />
                <StatCard 
                    title={t('admin.dashboard.activeOrders')} 
                    value={stats.activeOrdersCount}
                    icon="cube" 
                    color="#2563eb" // blue-600
                    bgColor="bg-blue-50"
                />
                <StatCard 
                    title={t('admin.dashboard.totalUsers')} 
                    value={stats.uniqueUsers}
                    icon="people" 
                    color="#7c3aed" // violet-600
                    bgColor="bg-violet-50"
                />
                <StatCard 
                    title={t('admin.dashboard.lowStock')} 
                    value={stats.lowStockCount}
                    icon="alert-circle" 
                    color="#dc2626" // red-600
                    bgColor="bg-red-50"
                />
            </View>

            {/* B. Sales Trend (Chart Kit) */}
            <View className="mx-5 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="font-bold text-gray-800">{t('admin.dashboard.salesTrend')}</Text>
                </View>
                <LineChart
                    data={{
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [
                        {
                        data: [
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100,
                            Math.random() * 100
                        ]
                        }
                    ]
                    }}
                    width={screenWidth - 70} // 30 padding + 40 inner padding
                    height={220}
                    yAxisLabel="₺"
                    yAxisSuffix="k"
                    yAxisInterval={1}
                    chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Amber-500
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray-500
                    style: {
                        borderRadius: 16
                    },
                    propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#d97706" // Amber-600
                    }
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>

            {/* C. Quick Actions (Grid) */}
            <View className="mb-2 px-5">
                <Text className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">{t('admin.dashboard.quickActions')}</Text>
                <View className="flex-row flex-wrap justify-between">
                    <QuickAction 
                        title={t('admin.adminProducts.title')} 
                        icon="list-outline" 
                        onPress={() => router.push("/(admin)/products")}
                    />
                    <QuickAction 
                        title={t('admin.dashboard.newProduct')} 
                        icon="add-circle-outline" 
                        onPress={() => router.push("/(admin)/add")}
                    />
                    <QuickAction 
                        title={t('admin.dashboard.viewOrders')} 
                        icon="receipt-outline" 
                        onPress={() => router.push("/(admin)/orders")}
                    />
                     <QuickAction 
                        title={t('analytics.title')} 
                        icon="bar-chart-outline" 
                        onPress={() => router.push("/(admin)/revenue")}
                    />
                     <QuickAction 
                        title={t('customers.title')} 
                        icon="people-outline" 
                        onPress={() => router.push("/(admin)/customers")}
                    />
                    <QuickAction 
                        title={t('admin.dashboard.attributes')} 
                        icon="options-outline" 
                        onPress={() => router.push("/(admin)/attributes")}
                    />
                    <QuickAction 
                        title={t('admin.dashboard.viewProfile')} 
                        icon="person-outline" 
                        onPress={() => router.push("/profile")}
                    />
                    {/* Placeholder for alignment if odd number in desktop */}
                     <View style={{ width: screenWidth > 768 ? '23%' : '48%' }} /> 
                </View>
            </View>

            {/* D. Top Selling Products */}
            <View className="mx-5 mt-2">
                 <Text className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">{t('admin.dashboard.topSelling')}</Text>
                 <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {stats.topSelling.length === 0 ? (
                        <Text className="p-4 text-gray-400 text-sm">{t('adminOrders.empty')}</Text>
                    ) : (
                        stats.topSelling.map((item, index) => (
                            <View key={index} className={`flex-row items-center p-3 ${index !== stats.topSelling.length -1 ? 'border-b border-gray-50' : ''}`}>
                                <Image source={{ uri: item.image }} className="w-10 h-10 rounded-lg bg-gray-100" />
                                <View className="flex-1 ml-3">
                                    <Text className="text-gray-800 font-medium text-sm" numberOfLines={1}>{item.title}</Text>
                                    <Text className="text-gray-400 text-xs">{item.count} {t('common.sales')}</Text>
                                </View>
                                <View className="bg-amber-50 px-2 py-1 rounded-md">
                                    <Text className="text-amber-800 font-bold text-xs">#{index + 1}</Text>
                                </View>
                            </View>
                        ))
                    )}
                 </View>
            </View>

             {/* E. Recent Activity */}
             <View className="mx-5 mt-6">
                 <Text className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">{t('admin.dashboard.recentActivity')}</Text>
                 <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {stats.recentActivity.length === 0 ? (
                        <Text className="p-4 text-gray-400 text-sm">{t('adminOrders.empty')}</Text>
                    ) : (
                        stats.recentActivity.map((order, index) => (
                            <View key={order.id} className={`flex-row items-center p-4 ${index !== stats.recentActivity.length -1 ? 'border-b border-gray-50' : ''}`}>
                                <View className={`w-2 h-2 rounded-full mr-3 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <View className="flex-1">
                                    <Text className="text-gray-800 font-medium text-sm">
                                        {t('orders.orderNumber')}: #{order.id.slice(0, 6).toUpperCase()}
                                    </Text>
                                    <Text className="text-gray-400 text-xs mt-0.5">
                                        {order.items?.length || 0} {t('common.items')} • {order.totalAmount} ₺
                                    </Text>
                                </View>
                                <Text className="text-gray-400 text-xs">
                                   {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </Text>
                            </View>
                        ))
                    )}
                 </View>
            </View>
        </ScrollView>
    </ScreenWrapper>
  );
}
