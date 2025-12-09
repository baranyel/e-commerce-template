import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "../../i18n/i18n"; // i18n başlatıcıyı import et
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, userProfile, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Dil Durumu (Türkçe mi?)
  const [isTurkish, setIsTurkish] = useState(i18n.language === "tr");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // _layout.tsx zaten bizi login'e atacak
    } catch (error) {
      console.error(error);
    }
  };

  const toggleLanguage = async () => {
    const newLang = isTurkish ? "en" : "tr";
    setIsTurkish(!isTurkish);
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem("language", newLang);
  };

  const handleAdminAccess = () => {
    if (isAdmin) {
      // Admin Dashboard'a git
      router.push("/(admin)/dashboard");
    } else {
      Alert.alert("Erişim Reddedildi", "Bu alana sadece yetkililer girebilir.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-4">
        {/* Profil Başlığı */}
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 bg-amber-200 rounded-full items-center justify-center mb-4 shadow-sm">
            <Text className="text-4xl">☕</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            {user?.displayName || "Misafir Kullanıcı"}
          </Text>
          <Text className="text-gray-500">{user?.email}</Text>

          {/* Admin Rozeti */}
          {isAdmin && (
            <View className="bg-amber-100 px-3 py-1 rounded-full mt-2 border border-amber-200">
              <Text className="text-amber-800 text-xs font-bold uppercase">
                Yönetici Hesabı
              </Text>
            </View>
          )}
        </View>

        {/* Menü Grupları */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Admin Paneli Girişi (Sadece Adminlere Gözükür) */}
          {isAdmin && (
            <TouchableOpacity
              onPress={handleAdminAccess}
              className="flex-row items-center p-4 border-b border-gray-100 bg-amber-50"
            >
              <View className="w-8 h-8 rounded-full bg-amber-900 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={18} color="white" />
              </View>
              <Text className="flex-1 font-bold text-amber-900 text-base">
                {t("adminPanel")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#78350f" />
            </TouchableOpacity>
          )}

          {/* Siparişlerim */}
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Ionicons
              name="cube-outline"
              size={22}
              color="#4b5563"
              className="mr-3"
            />
            <Text className="flex-1 text-gray-700 text-base ml-3">
              {t("orders")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Dil Değiştirme */}
          <View className="flex-row items-center p-4 justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons
                name="language-outline"
                size={22}
                color="#4b5563"
                className="mr-3"
              />
              <Text className="text-gray-700 text-base ml-3">
                {t("language")} ({isTurkish ? "TR" : "EN"})
              </Text>
            </View>
            <Switch
              value={isTurkish}
              onValueChange={toggleLanguage}
              trackColor={{ false: "#e5e7eb", true: "#78350f" }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {/* Çıkış Butonu */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-white p-4 rounded-xl shadow-sm border border-red-100"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="ml-2 text-red-500 font-bold text-base">
            {t("logout")}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-400 text-xs mt-8">
          v1.0.0 • Lupin Coffee App
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
