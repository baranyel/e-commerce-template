  import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  Platform,
} from "react-native";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { ProductCard } from "../../components/ui/ProductCard";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product, Attribute, Term } from "../../types";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";
import { getAttributes, getTerms } from "../../services/attributeService";

export default function SearchScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  // --- RESPONSIVE SETTINGS ---
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const containerWidth = Math.min(width, 1200);
  const SIDEBAR_WIDTH = 250;
  const contentWidth = isWeb ? containerWidth - SIDEBAR_WIDTH : width;
  const numColumns = isWeb ? 3 : 2;
  const GAP = 12;
  const cardWidth = (contentWidth - 24 - (numColumns - 1) * GAP) / numColumns;

  // --- DATA STATE ---
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Attributes State
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [termsMap, setTermsMap] = useState<Record<string, Term[]>>({}); // attrId -> terms
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Filter State
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({}); // attrId -> termId
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({}); // termId -> isExpanded (for tree)

  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Mobile Drawer
  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchConfig();

    const qProd = query(collection(db, "products"), orderBy("title"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[];
      
      // Client-side visibility filter (Backward compatibility: undefined = true)
      const activeProducts = data.filter(p => p.isActive !== false);
      
      setAllProducts(activeProducts);
      // Trigger initial filter
      // setFilteredProducts will be called by the filter effect
      setLoadingProducts(false);
    });

    return () => unsubProd();
  }, []);

  const fetchConfig = async () => {
    try {
      const attrs = await getAttributes();
      const activeAttrs = attrs.filter(a => a.isActive);
      setAttributes(activeAttrs);
      
      const tMap: Record<string, Term[]> = {};
      for (const attr of activeAttrs) {
        const terms = await getTerms(attr.id);
        tMap[attr.id] = terms;
      }
      setTermsMap(tMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = allProducts;

    // 1. Text Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      );
    }

    // 2. Price Filter
    if (minPrice)
      result = result.filter((p) => p.price >= parseFloat(minPrice));
    if (maxPrice)
      result = result.filter((p) => p.price <= parseFloat(maxPrice));

    // 3. Attribute Filters (The Core Logic)
    Object.entries(selectedFilters).forEach(([attrId, termId]) => {
        if (!termId) return;
        
        // Logic: 
        // Iterate over products. Check if p.attributes[attrId] matches termId.
        // OR if p.attributes[attrId] is a CHILD of termId (for hierarchy).
        // However, standard e-commerce usually stores the specific leaf term ID in the product.
        // If user selects "Coffee" (Parent), we should show products with "Espresso" (Child).
        // This requires checking "is ancestor of".
        
        // Efficient way: Get all descendant term IDs of selected `termId`.
        const descendants = getDescendantTermIds(attrId, termId);
        const validTermIds = [termId, ...descendants];

        result = result.filter(p => {
            const productTermId = p.attributes?.[attrId];
            if (!productTermId) return false;
            return validTermIds.includes(productTermId);
        });
    });

    setFilteredProducts(result);
  }, [searchQuery, minPrice, maxPrice, allProducts, selectedFilters, termsMap]);

  // Helper to get all children, grandchildren etc.
  const getDescendantTermIds = (attrId: string, parentTermId: string): string[] => {
      const allTerms = termsMap[attrId] || [];
      const children = allTerms.filter(t => t.parentId === parentTermId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
          ids = [...ids, ...getDescendantTermIds(attrId, c.id)];
      });
      return ids;
  };

  const toggleFilter = (attrId: string, termId: string) => {
      setSelectedFilters(prev => {
          if (prev[attrId] === termId) {
              const copy = { ...prev };
              delete copy[attrId];
              return copy;
          }
          return { ...prev, [attrId]: termId };
      });
  };

  const toggleExpand = (termId: string) => {
    setExpandedTerms(prev => ({ ...prev, [termId]: !prev[termId] }));
  };

  // --- RENDERERS ---

  const renderGenericFilter = (attr: Attribute) => {
      const terms = termsMap[attr.id] || [];
      
      if (attr.isHierarchical) {
          // Recursive Tree
          return (
              <View>
                   {renderTreeNodes(attr.id, terms, null, 0)}
              </View>
          );
      } else {
          // Flat List
          return (
              <View className="flex-row flex-wrap">
                  {terms.map(term => (
                      <TouchableOpacity
                        key={term.id}
                        onPress={() => toggleFilter(attr.id, term.id)}
                        className={`mr-2 mb-2 px-3 py-1 rounded-full border ${selectedFilters[attr.id] === term.id ? 'bg-amber-900 border-amber-900' : 'bg-white border-gray-200'}`}
                      >
                          <Text className={`text-xs ${selectedFilters[attr.id] === term.id ? 'text-white' : 'text-gray-600'}`}>
                              {term.name}
                          </Text>
                      </TouchableOpacity>
                  ))}
              </View>
          );
      }
  };

  const renderTreeNodes = (attrId: string, allTerms: Term[], parentId: string | null, level = 0) => {
      const nodes = allTerms.filter(t => t.parentId === parentId);
      if (nodes.length === 0) return null;

      return nodes.map(node => {
         const hasChildren = allTerms.some(t => t.parentId === node.id);
         const isExpanded = expandedTerms[node.id];
         const isSelected = selectedFilters[attrId] === node.id;
         
         return (
             <View key={node.id} style={{ marginLeft: level * 8 }}>
                 <View className="flex-row items-center py-1">
                     {hasChildren ? (
                         <TouchableOpacity onPress={() => toggleExpand(node.id)} className="p-1 mr-1">
                             <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={14} color="gray" />
                         </TouchableOpacity>
                     ) : <View className="w-6" />}
                     
                     <TouchableOpacity onPress={() => toggleFilter(attrId, node.id)} className="flex-row items-center">
                         <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${isSelected ? 'bg-amber-900 border-amber-900' : 'border-gray-300'}`}>
                              {isSelected && <Ionicons name="checkmark" size={10} color="white" />}
                         </View>
                         <Text className={`${isSelected ? 'font-bold text-amber-900' : 'text-gray-600'}`}>{node.name}</Text>
                     </TouchableOpacity>
                 </View>
                 {hasChildren && isExpanded && renderTreeNodes(attrId, allTerms, node.id, level + 1)}
             </View>
         );
      });
  };

  // --- FILTER SIDEBAR COMPONENT ---
  const FilterContent = ({ isMobileSidebar = false }) => (
    <View className="flex-1">
      {isMobileSidebar && (
        <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-800">{t('common.filter')}</Text>
          <TouchableOpacity onPress={() => setMobileFilterOpen(false)} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search */}
      <View className="bg-gray-100 rounded-xl px-3 py-3 mb-6 flex-row items-center">
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder={t('adminDashboard.searchPlaceholder')}
          className="flex-1 ml-2 text-gray-700 font-medium h-full outline-none" 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Attributes */}
      {loadingConfig ? (
          <ActivityIndicator />
      ) : (
          attributes.map(attr => (
              <View key={attr.id} className="mb-6">
                  <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">{attr.name}</Text>
                  {renderGenericFilter(attr)}
              </View>
          ))
      )}

      {/* Price */}
      <View className="mb-6">
        <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
          {t("admin.price")}
        </Text>
        <View className="flex-row items-center space-x-2 w-full">
          <TextInput
            placeholder="Min"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
            className="flex-1 min-w-0 bg-white border border-gray-200 p-2 rounded-lg text-sm"
          />
          <Text className="text-gray-400 font-bold">-</Text>
          <TextInput
            placeholder="Max"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
            className="flex-1 min-w-0 bg-white border border-gray-200 p-2 rounded-lg text-sm"
          />
        </View>
      </View>
      
      {/* Clear Filters */}
      <TouchableOpacity
        onPress={() => {
            setSelectedFilters({});
            setSearchQuery("");
            setMinPrice("");
            setMaxPrice("");
        }}
        className="bg-gray-200 py-3 rounded-xl items-center"
      >
          <Text className="text-gray-700 font-bold text-xs">{t('adminOrders.clear')}</Text>
      </TouchableOpacity>

      {isMobileSidebar && (
        <TouchableOpacity
          onPress={() => setMobileFilterOpen(false)}
          className="mt-4 bg-amber-900 py-3 rounded-xl items-center shadow-md"
        >
          <Text className="text-white font-bold">
            {t('common.filter')} ({filteredProducts.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: Product }) => {
    return (
        <ProductCard
            item={item}
            layout={isGridLayout ? "grid" : "list"}
            onPress={() => router.push(`/product/${item.id}` as any)}
            onAddToCart={(product) => addToCart(product)}
            containerStyle={isGridLayout ? { width: cardWidth, margin: 0, marginBottom: 12 } : { width: '100%' }}
        />
    );
  };

  return (
    <ScreenWrapper>
      {/* --- MOBILE SIDEBAR --- */}
      {!isWeb && isMobileFilterOpen && (
        <View className="absolute inset-0 z-50 flex-row">
          <TouchableOpacity
            activeOpacity={1}
            className="absolute inset-0 bg-black/50"
            onPress={() => setMobileFilterOpen(false)}
          />
          <View className="w-[80%] h-full bg-white p-5 shadow-2xl z-50">
            <FilterContent isMobileSidebar={true} />
          </View>
        </View>
      )}

      <View className="flex-1 w-full flex-row"> 
        {/* --- WEB SIDEBAR --- */}
        {isWeb && (
            <View style={{ width: SIDEBAR_WIDTH }} className="mr-6 pt-4 pl-4 h-full"> 
                <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm sticky top-4 max-h-[90vh]">
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <FilterContent />
                    </ScrollView>
                </View>
            </View>
        )}

        <View className="flex-1">
            {/* --- MOBILE TOGGLE BAR --- */}
            {!isWeb && (
                <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10 mb-4">
                    <TouchableOpacity
                    onPress={() => setMobileFilterOpen(true)}
                    className="flex-row items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                    >
                    <Ionicons name="filter" size={18} color="#4b5563" />
                    <Text className="text-gray-700 font-medium text-sm">
                        {t('common.filter')}
                    </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => setIsGridLayout(!isGridLayout)}
                    className="p-2"
                    >
                    <Ionicons
                        name={isGridLayout ? "list" : "grid"}
                        size={22}
                        color="#4b5563"
                    />
                    </TouchableOpacity>
                </View>
            )}

            {/* WEB TOP BAR */}
             {isWeb && (
                <View className="flex-row justify-between items-center mb-4 pt-4 px-2">
                  <Text className="text-gray-500 font-bold">
                    {filteredProducts.length} Results
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsGridLayout(!isGridLayout)}
                    className="p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <Ionicons
                      name={isGridLayout ? "list" : "grid"}
                      size={20}
                      color="#4b5563"
                    />
                  </TouchableOpacity>
                </View>
              )}

            {/* --- PRODUCT LIST --- */}
            <FlatList
                key={isGridLayout ? `grid-${numColumns}` : "list"}
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={isGridLayout ? numColumns : 1}
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: isWeb ? 0 : 12 }}
                columnWrapperStyle={isGridLayout ? { gap: GAP } : undefined}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                <View className="items-center mt-20">
                    {loadingProducts ? (
                    <ActivityIndicator color="#78350f" />
                    ) : (
                    <Text className="text-gray-400">{t('adminProducts.empty')}</Text>
                    )}
                </View>
                }
            />
        </View>
      </View>
    </ScreenWrapper>
  );
}

