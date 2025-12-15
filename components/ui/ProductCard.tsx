import React from "react";
import { View, Text, Image, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Product } from "../../types";
import { useFavorites } from "../../hooks/useFavorites";

interface ProductCardProps {
  item: Product;
  layout?: "grid" | "list" | "carousel";
  onPress?: () => void;
  isAdmin?: boolean;
  onAddToCart?: (item: Product) => void;
  onEdit?: (item: Product) => void;
  onDelete?: (item: Product) => void;
  showStockWarning?: boolean;
  containerStyle?: ViewStyle;
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
  containerStyle,
}) => {
  const { t } = useTranslation();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(item.id);
  const isLowStock = showStockWarning && item.stock < 5;

  if (layout === "grid") {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-1 m-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative"
        style={containerStyle}
      >
        {isAdmin && isLowStock && (
          <View className="absolute top-2 left-2 z-10 bg-red-100 px-2 py-1 rounded-md">
            <Text className="text-red-600 text-[10px] font-bold">{t("product.lowStock")}</Text>
          </View>
        )}
        
        {/* Favorite Button (User Only) */}
        {!isAdmin && (
            <TouchableOpacity 
                onPress={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                className="absolute top-2 right-2 z-10 bg-white/80 p-1.5 rounded-full shadow-sm"
            >
                <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={20} 
                    color={isFavorite ? "#ef4444" : "#9ca3af"} 
                />
            </TouchableOpacity>
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
                  <Text className="text-amber-800 font-bold text-xs">{t("product.addToCart")}</Text>
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
                    {t("product.stock")}: {item.stock}
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
      style={containerStyle}
    >
      <Image
        source={{ uri: item.images[0] || "https://via.placeholder.com/150" }}
        className="w-24 h-24 rounded-lg bg-gray-100"
      />
      <View className="flex-1 ml-4 justify-between py-1">
        <View>
          <View className="flex-row justify-between items-start">
             <Text className="text-xs text-amber-800 font-bold uppercase mb-1">
                {item.category}
              </Text>
              {/* Actions Row Top Right */}
              <View className="flex-row items-center space-x-2">
                 {/* Favorite Button (User only) */}
                  {!isAdmin && (
                        <TouchableOpacity 
                            onPress={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                            className="mr-1"
                        >
                            <Ionicons 
                                name={isFavorite ? "heart" : "heart-outline"} 
                                size={22} 
                                color={isFavorite ? "#ef4444" : "#9ca3af"} 
                            />
                        </TouchableOpacity>
                  )}
                  
                  {isAdmin && isLowStock && (
                    <Text className="text-red-500 text-xs font-bold ml-2">
                    {t("product.criticalStock")}
                    </Text>
                  )}
              </View>
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
                    <Text className="text-amber-900 font-bold text-xs">{t("product.addToCart")}</Text>
                  </TouchableOpacity>
              )}
            </View>
        ) : (
             <View className="flex-row justify-between items-center mt-2">
                <View>
                    <Text className="text-gray-500 text-xs">
                        {item.stock} {t("product.pieces")}
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
