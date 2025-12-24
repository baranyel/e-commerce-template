import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable, View, Platform } from "react-native";
// 1. İMPORT EKLE
import { useTranslation } from "react-i18next";

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

  // 2. TRANSLATION HOOK'UNU ÇAĞIR
  const { t } = useTranslation();

  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";
  const innerBackgroundColor = Colors[colorScheme ?? "light"].background;

  return (
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          backgroundColor: innerBackgroundColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 5,
        }}
      >
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            headerShown: useClientOnlyValue(false, true),
            tabBarStyle: {
              backgroundColor: innerBackgroundColor,
              borderTopWidth: 0,
              elevation: 0,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              // 3. STATİK METNİ DEĞİŞTİR
              title: t("tabs.home"),
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="home" color={color} />
              ),
              headerRight: () => (
                <Link href="/modal" asChild>

                </Link>
              ),
            }}
          />
          <Tabs.Screen
            name="two"
            options={{
              // 3. STATİK METNİ DEĞİŞTİR
              title: t("tabs.explore"),
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="search" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              // 3. STATİK METNİ DEĞİŞTİR
              title: t("tabs.profile"),
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