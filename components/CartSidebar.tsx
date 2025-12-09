import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Platform,
} from "react-native";
import { useCart } from "../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartSidebar() {
  const {
    cart,
    isCartOpen,
    toggleCart,
    removeFromCart,
    updateQuantity,
    totalPrice,
  } = useCart();
  const router = useRouter();

  if (!isCartOpen) return null;

  return (
    // Tüm ekranı kaplayan şeffaf overlay
    <Modal
      animationType="fade"
      transparent={true}
      visible={isCartOpen}
      onRequestClose={toggleCart}
    >
      <View className="flex-1 flex-row">
        {/* Sol taraftaki boşluk (Tıklayınca kapanır) */}
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={toggleCart}
        />

        {/* Sağ taraftaki Sidebar */}
        <View className="w-[85%] sm:w-[400px] bg-white h-full shadow-2xl">
          <SafeAreaView className="flex-1">
            {/* Başlık ve Kapat Butonu */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">
                Sepetim ({cart.length})
              </Text>
              <TouchableOpacity onPress={toggleCart} className="p-2">
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Ürün Listesi */}
            <ScrollView className="flex-1 p-4">
              {cart.length === 0 ? (
                <View className="items-center justify-center mt-20">
                  <Ionicons name="cart-outline" size={64} color="#ccc" />
                  <Text className="text-gray-400 mt-4">Sepetin şu an boş.</Text>
                  <TouchableOpacity onPress={toggleCart} className="mt-4">
                    <Text className="text-amber-800 font-bold">
                      Alışverişe Başla
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                cart.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row mb-6 border-b border-gray-50 pb-4"
                  >
                    <Image
                      source={{ uri: item.images[0] }}
                      className="w-20 h-20 rounded-lg bg-gray-100"
                    />
                    <View className="flex-1 ml-4 justify-between">
                      <View>
                        <Text
                          className="font-bold text-gray-800 text-sm"
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1">
                          {item.category}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="font-bold text-amber-800">
                          {item.price} {item.currency}
                        </Text>

                        {/* Miktar Artır/Azalt */}
                        <View className="flex-row items-center bg-gray-100 rounded-lg">
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 px-2"
                          >
                            <Text className="font-bold text-gray-600">-</Text>
                          </TouchableOpacity>
                          <Text className="mx-2 font-bold text-gray-800">
                            {item.quantity}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 px-2"
                          >
                            <Text className="font-bold text-gray-600">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {/* Sil Butonu */}
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.id)}
                      className="ml-2"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Alt Toplam ve Ödeme Butonu */}
            {cart.length > 0 && (
              <View className="p-4 border-t border-gray-100 bg-gray-50">
                <View className="flex-row justify-between mb-4">
                  <Text className="text-gray-600">Ara Toplam</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {totalPrice} TRY
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    toggleCart();
                    // İleride Checkout sayfasına yönlendireceğiz
                    alert("Ödeme sayfasına gidiliyor...");
                  }}
                  className="bg-amber-900 p-4 rounded-xl flex-row justify-center items-center"
                >
                  <Text className="text-white font-bold text-lg mr-2">
                    Sepeti Onayla
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
