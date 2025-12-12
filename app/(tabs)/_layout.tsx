import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable, View, Platform } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Renk Ayarları
  // Dış taraf (Boşluklar): Açık modda Gri (#F3F4F6), Koyu modda Tam Siyah
  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";

  // İç taraf (İçerik): Açık modda Beyaz, Koyu modda Koyu Gri/Siyah
  const innerBackgroundColor = Colors[colorScheme ?? "light"].background;

  return (
    // 1. KATMAN: Tün Ekran Arka Planı (Kenar boşluklarına rengini veren yer)
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      {/* 2. KATMAN: İçerik Kutusu (Maksimum 1200px) */}
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          backgroundColor: innerBackgroundColor, // İçeriğin zemin rengi

          // Sınırın iyice belli olması için hafif bir gölge (Opsiyonel ama çok şık durur)
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 5, // Android gölgesi

          // Kenarların keskin durmaması için (Sadece Web'de istersen)
          // overflow: 'hidden' // Gerekirse açabilirsin
        }}
      >
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            headerShown: useClientOnlyValue(false, true),
            // TabBar'ın da arka planını içerikle eşleştirelim
            tabBarStyle: {
              backgroundColor: innerBackgroundColor,
              borderTopWidth: 0, // Çizgiyi kaldırıp daha temiz görüntü
              elevation: 0, // Android gölgesini kaldır
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Anasayfa",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="home" color={color} />
              ),
              headerRight: () => (
                <Link href="/modal" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <FontAwesome
                        name="info-circle"
                        size={25}
                        color={Colors[colorScheme ?? "light"].text}
                        style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                </Link>
              ),
            }}
          />
          <Tabs.Screen
            name="two"
            options={{
              title: "Keşfet",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="search" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profil",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="user" color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
