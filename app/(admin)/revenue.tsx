import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Modal, Image } from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useTranslation } from "react-i18next";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

const screenWidth = Dimensions.get("window").width;

export default function RevenueAnalyticsScreen() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Varsayılan: Son 7 gün
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultEnd.getDate() - 6);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Picker Kontrolü
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Veri Çekme (Aynı kalıyor)
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "asc"));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      const validOrders = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((o: any) => o.status !== "cancelled");
      setOrders(validOrders);
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        // Updated to include images
        setProducts(snapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, title: data.title, images: data.images, favoriteCount: data.favoriteCount };
        }));
    });

    return () => { unsubOrders(); unsubProducts(); };
  }, []);

  // --- WEB DATE PICKER ---
  const WebDatePicker = ({ value, onChange }: { value: Date, onChange: (date: Date) => void }) => {
    if (Platform.OS !== 'web') return null;
    
    return (
      <input
        type="date"
        value={value.toISOString().split('T')[0]}
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1f2937',
          width: '100%',
          outline: 'none',
          fontFamily: 'inherit'
        }}
        onChange={(e) => {
            if(e.target.valueAsDate) onChange(e.target.valueAsDate);
        }}
      />
    );
  };

  // --- CALCULATION LOGIC ---
  const { chartData, totalRevenue, dailyAverage, bestDay } = useMemo(() => {
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];
    const startStr = toDateStr(startDate);
    const endStr = toDateStr(endDate);

    let filtered = orders.filter(o => {
        if (!o.createdAt) return false;
        const seconds = o.createdAt.seconds ? o.createdAt.seconds : (typeof o.createdAt === 'number' ? o.createdAt / 1000 : 0);
        if(!seconds) return false;

        const d = new Date(seconds * 1000).toISOString().split('T')[0];
        return d >= startStr && d <= endStr;
    });

    if (selectedProductId) {
        filtered = filtered.filter(o => o.items.some((i: any) => i.id === selectedProductId));
    }

    const dayMap = new Map<string, number>();
    const curr = new Date(startDate);
    const end = new Date(endDate);
    
    while (curr <= end) {
        const dStr = toDateStr(curr);
        const label = dStr.slice(8, 10) + '/' + dStr.slice(5, 7);
        dayMap.set(label, 0);
        curr.setDate(curr.getDate() + 1);
    }

    let total = 0;
    filtered.forEach(o => {
        const seconds = o.createdAt.seconds ? o.createdAt.seconds : (typeof o.createdAt === 'number' ? o.createdAt / 1000 : 0);
        const dateObj = new Date(seconds * 1000);
        const dStr = toDateStr(dateObj);
        const label = dStr.slice(8, 10) + '/' + dStr.slice(5, 7);

        let amount = Number(o.totalAmount);
        if (selectedProductId) {
             const item = o.items.find((i: any) => i.id === selectedProductId);
             amount = item ? (item.price * item.quantity) : 0;
        }

        if (dayMap.has(label)) {
             dayMap.set(label, (dayMap.get(label) || 0) + amount);
        }
        total += amount;
    });

    const labels = Array.from(dayMap.keys());
    const data = Array.from(dayMap.values());

    let bestVal = 0;
    let bestDayLabel = "-";
    dayMap.forEach((val, key) => {
        if (val > bestVal) { bestVal = val; bestDayLabel = key; }
    });

    const daysDiff = Math.max(1, labels.length);
    const avg = total / daysDiff;

    return {
        chartData: {
            labels: labels.length > 0 ? labels : ["-"],
            datasets: [{ data: data.length > 0 ? data : [0] }]
        },
        totalRevenue: total,
        dailyAverage: avg,
        bestDay: bestVal > 0 ? `${bestDayLabel} (${bestVal}₺)` : "-"
    };
  }, [orders, startDate, endDate, selectedProductId]);

  // --- MOBILE DATE CHANGE ---
  const onMobileDateChange = (event: any, selectedDate?: Date) => {
      const mode = showPicker;
      if (Platform.OS === 'android') setShowPicker(null);
      
      if (selectedDate && mode) {
          if (mode === 'start') setStartDate(selectedDate);
          else setEndDate(selectedDate);
      }
  };

  const DateButton = ({ label, date, mode }: { label: string, date: Date, mode: 'start' | 'end' }) => (
      <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">{label}</Text>
          <TouchableOpacity 
            onPress={() => Platform.OS !== 'web' && setShowPicker(mode)}
            className="bg-white border border-gray-200 p-3 rounded-xl flex-row items-center justify-between shadow-sm relative overflow-hidden"
          >
              {Platform.OS === 'web' ? (
                 <WebDatePicker value={date} onChange={(d) => mode === 'start' ? setStartDate(d) : setEndDate(d)} />
              ) : (
                 <Text className="text-gray-800 text-sm font-medium">
                     {date.toLocaleDateString()}
                 </Text>
              )}
              <View pointerEvents="none">
                 <Ionicons name="calendar-outline" size={16} color="#4b5563" />
              </View>
          </TouchableOpacity>
      </View>
  );

  const StatCard = ({ title, value, icon, color }: any) => (
      <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-1 min-w-[30%]">
          <View className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${color === 'green' ? 'bg-green-100' : color === 'blue' ? 'bg-blue-100' : 'bg-amber-100'}`}>
              <Ionicons name={icon} size={16} color={color === 'green' ? '#16a34a' : color === 'blue' ? '#2563eb' : '#d97706'} />
          </View>
          <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">{title}</Text>
          <Text className="text-lg font-bold text-gray-900">{value}</Text>
      </View>
  );

  return (
    <ScreenWrapper>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Header */}
            <View className="px-5 pt-6 pb-2">
                <Text className="text-2xl font-bold text-gray-900">{t('analytics.title')}</Text>
            </View>

            {/* Date Filters */}
            <View className="px-5 mb-4 flex-row space-x-3">
                <DateButton label={t('analytics.startDate')} date={startDate} mode="start" />
                <DateButton label={t('analytics.endDate')} date={endDate} mode="end" />
            </View>

            {/* --- MOBILE MODAL PICKER --- */}
            {Platform.OS !== 'web' && showPicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="fade" visible={!!showPicker}>
                        <View className="flex-1 justify-center items-center bg-black/50">
                            <View className="bg-white p-4 rounded-xl w-[90%]">
                                <DateTimePicker
                                    value={showPicker === 'start' ? startDate : endDate}
                                    mode="date"
                                    display="inline"
                                    onChange={onMobileDateChange}
                                />
                                <TouchableOpacity onPress={() => setShowPicker(null)} className="bg-amber-900 p-3 rounded-lg mt-2 items-center">
                                    <Text className="text-white font-bold">{t('common.ok')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={showPicker === 'start' ? startDate : endDate}
                        mode="date"
                        display="default"
                        onChange={onMobileDateChange}
                    />
                )
            )}

            {/* Product Filter Chips */}
            <View className="mb-6 pl-5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                    <TouchableOpacity 
                        onPress={() => setSelectedProductId(null)}
                        className={`px-4 py-2 rounded-full mr-2 border shadow-sm flex-row items-center ${!selectedProductId ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-200'}`}
                    >
                        <Text className={`text-xs font-bold ${!selectedProductId ? 'text-white' : 'text-gray-600'}`}>
                            {t('analytics.allProducts')}
                        </Text>
                    </TouchableOpacity>
                    {products.map(p => (
                        <TouchableOpacity 
                            key={p.id}
                            onPress={() => setSelectedProductId(p.id)}
                            className={`pl-2 pr-4 py-1.5 rounded-full mr-2 border shadow-sm flex-row items-center ${selectedProductId === p.id ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-200'}`}
                        >
                            <Image 
                                source={{ uri: p.images?.[0] || "https://via.placeholder.com/150" }} 
                                className="w-6 h-6 rounded-full mr-2 bg-gray-200"
                            />
                            <Text className={`text-xs font-bold ${selectedProductId === p.id ? 'text-white' : 'text-gray-600'}`}>
                                {p.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <View className="w-5" /> 
                </ScrollView>
            </View>

            {/* Chart Section */}
            <View className="px-5 mb-6">
                {loading ? (
                    <ActivityIndicator size="large" color="#d97706" />
                ) : (
                    <View className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
                         <Text className="absolute top-4 left-4 text-xs font-bold text-gray-400 z-10">
                            {t('admin.dashboard.salesTrend')}
                        </Text>
                        {/* Grafik verisi yoksa 0 göstererek hatayı önle */}
                        <LineChart
                            data={chartData}
                            width={screenWidth - 40} // Kenar boşluklarını düşüyoruz
                            height={240}
                            yAxisLabel=""
                            yAxisSuffix="₺"
                            chartConfig={{
                                backgroundColor: "#ffffff",
                                backgroundGradientFrom: "#ffffff",
                                backgroundGradientTo: "#ffffff",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(217, 119, 6, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "5", strokeWidth: "2", stroke: "#fbbf24" },
                                propsForBackgroundLines: { strokeDasharray: "" }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16, paddingTop: 20 }}
                            verticalLabelRotation={-30} 
                        />
                    </View>
                )}
            </View>

            {/* Product Performance Table */}
            <View className="px-5 mb-8">
                 <Text className="text-lg font-bold text-gray-900 mb-3">{t('analytics.performance') || "Product Performance"}</Text>
                 <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                     {/* Table Header */}
                     <View className="flex-row bg-gray-50 border-b border-gray-100 p-3">
                         <Text className="flex-[2] text-xs font-bold text-gray-500 uppercase">{t('admin.productName') || "Product"}</Text>
                         <Text className="flex-1 text-xs font-bold text-gray-500 text-center uppercase">{t('analytics.sales') || "Sales"}</Text>
                         <Text className="flex-1 text-xs font-bold text-gray-500 text-center uppercase">{t('analytics.interest') || "Interest"}</Text>
                     </View>

                     {/* Rows */}
                     {products
                        .map(product => {
                           // Calculate Sales for this product (ALL TIME)
                           const salesCount = orders
                             .reduce((acc, order) => {
                                 const item = order.items.find((i: any) => i.id === product.id);
                                 return acc + (item ? item.quantity : 0);
                             }, 0);
                            return { ...product, salesCount };
                        })
                        .sort((a,b) => (b.salesCount + (b.favoriteCount || 0)) - (a.salesCount + (a.favoriteCount || 0)))
                        .slice(0, 10) // Top 10
                        .map((product, index) => (
                         <View key={product.id} className={`flex-row items-center p-3 ${index !== products.length - 1 ? 'border-b border-gray-100' : ''}`}>
                             {/* Product Info */}
                             <View className="flex-[2] flex-row items-center pr-2">
                                 <Image source={{ uri: product.images?.[0] || "https://via.placeholder.com/40" }} className="w-8 h-8 rounded-md bg-gray-200 mr-2" />
                                 <Text numberOfLines={1} className="flex-1 text-xs font-bold text-gray-800">{product.title}</Text>
                             </View>

                             {/* Sales */}
                             <View className="flex-1 items-center justify-center">
                                 <View className="bg-green-100 px-2 py-1 rounded-md">
                                     <Text className="text-xs font-bold text-green-700">{product.salesCount}</Text>
                                 </View>
                             </View>

                             {/* Interest (Favorites) */}
                             <View className="flex-1 items-center justify-center">
                                 <View className="bg-red-50 px-2 py-1 rounded-md flex-row items-center">
                                     <Ionicons name="heart" size={10} color="#ef4444" style={{marginRight:2}} />
                                     <Text className="text-xs font-bold text-red-600">{product.favoriteCount || 0}</Text>
                                 </View>
                             </View>
                         </View>
                     ))}
                 </View>
            </View>

            {/* Stats Cards */}
            <View className="px-4 flex-row justify-between mb-8">
                <StatCard 
                    title={t('analytics.totalInPeriod')} 
                    value={`${totalRevenue.toLocaleString()} ₺`} 
                    icon="wallet-outline" 
                    color="green" 
                />
                <StatCard 
                    title={t('analytics.avgDaily')} 
                    value={`${dailyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₺`} 
                    icon="stats-chart-outline" 
                    color="blue" 
                />
                <StatCard 
                    title={t('analytics.bestDay')} 
                    value={bestDay} 
                    icon="trophy-outline" 
                    color="amber" 
                />
            </View>

        </ScrollView>
    </ScreenWrapper>
  );
}