import React from "react";
import { View, Text, Image, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "../../types";

interface ProductCardProps {
  item: Product;
  layout?: "grid" | "list" | "carousel";
  onPress?: () => void;
  isAdmin?: boolean;
  onAddToCart?: (item: Product) => void;
  onEdit?: (item: Product) => void;
  onDelete?: (item: Product) => void;
  showStockWarning?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  layout = "grid",
  onPress,
  isAdmin = false,
  onAddToCart,
  onEdit,
  onDelete,
  showStockWarning = true,
}) => {
  const isLowStock = showStockWarning && item.stock < 5;

  if (layout === "grid") {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-1 m-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative"
      >
        {isAdmin && isLowStock && (
          <View className="absolute top-2 right-2 z-10 bg-red-100 px-2 py-1 rounded-md">
            <Text className="text-red-600 text-[10px] font-bold">STOK AZ</Text>
          </View>
        )}

        <Image
          source={{ uri: item.images[0] || "https://via.placeholder.com/150" }}
          className="w-full h-40 object-cover bg-gray-100" // Increased height slightly for better visual
        />
        <View className="p-3">
          <Text
            className="text-gray-900 font-bold text-sm mb-1"
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {!isAdmin ? (
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-amber-800 font-bold text-base">
                {item.price} {item.currency}
              </Text>
              {onAddToCart && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onAddToCart(item);
                  }}
                  className="bg-amber-100 p-2 rounded-full"
                >
                  <Text className="text-amber-800 font-bold text-xs">+</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-amber-800 font-bold text-xs">
                    {item.price} {item.currency}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isLowStock ? "text-red-500 font-bold" : "text-gray-400"
                    }`}
                  >
                    Stok: {item.stock}
                  </Text>
                </View>

                <View className="flex-row space-x-2 mt-1">
                  {onEdit && (
                    <TouchableOpacity
                      onPress={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                      }}
                      className="flex-1 bg-blue-50 py-2 rounded-lg items-center"
                    >
                      <Ionicons name="create" size={16} color="#2563eb" />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                     <TouchableOpacity
                      onPress={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                      }}
                      className="flex-1 bg-red-50 py-2 rounded-lg items-center"
                    >
                      <Ionicons name="trash" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // List Layout
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row mb-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-3"
    >
      <Image
        source={{ uri: item.images[0] || "https://via.placeholder.com/150" }}
        className="w-24 h-24 rounded-lg bg-gray-100"
      />
      <View className="flex-1 ml-4 justify-between py-1">
        <View>
          <View className="flex-row justify-between">
             <Text className="text-xs text-amber-800 font-bold uppercase mb-1">
                {item.category}
              </Text>
              {isAdmin && isLowStock && (
                <Text className="text-red-500 text-xs font-bold ml-2">
                  KRİTİK STOK
                </Text>
              )}
          </View>
         
          <Text className="text-gray-900 font-bold text-lg" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {!isAdmin ? (
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-lg font-bold text-gray-900">
                {item.price} {item.currency}
              </Text>
              {onAddToCart && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onAddToCart(item);
                    }}
                    className="bg-amber-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-amber-900 font-bold text-xs">Ekle +</Text>
                  </TouchableOpacity>
              )}
            </View>
        ) : (
             <View className="flex-row justify-between items-center mt-2">
                <View>
                    <Text className="text-gray-500 text-xs">
                        {item.stock} Adet
                    </Text>
                    <Text className="text-amber-800 font-bold">
                        {item.price} {item.currency}
                    </Text>
                </View>
                
                 <View className="flex-row items-center space-x-2">
                    {onEdit && (
                        <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        className="p-2 bg-blue-50 rounded-lg"
                        >
                        <Ionicons name="create-outline" size={20} color="#2563eb" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                         <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                        }}
                        className="p-2 bg-red-50 rounded-lg"
                        >
                        <Ionicons name="trash-outline" size={20} color="#dc2626" />
                        </TouchableOpacity>
                    )}
                 </View>
             </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
