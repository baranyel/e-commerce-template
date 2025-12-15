import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  getAttributes,
  addAttribute,
  updateAttribute,
  deleteAttribute,
  getTerms,
  addTerm,
  deleteTerm,
} from "../../services/attributeService";
import { Attribute, Term } from "../../types";

export default function AttributesScreen() {
  const { t } = useTranslation();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selected Attribute to edit/view terms
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null
  );

  // States for Attribute Modal
  const [attributeModalVisible, setAttributeModalVisible] = useState(false);
  const [attrName, setAttrName] = useState("");
  const [attrType, setAttrType] = useState<"select" | "multiselect" | "range">(
    "select"
  );
  const [attrIsHierarchical, setAttrIsHierarchical] = useState(false);
  const [attrIsActive, setAttrIsActive] = useState(true);

  // States for Term Management
  const [terms, setTerms] = useState<Term[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [termModalVisible, setTermModalVisible] = useState(false);
  const [termName, setTermName] = useState("");
  const [parentTermId, setParentTermId] = useState<string | null>(null);

  useEffect(() => {
    fetchAttributes();
  }, []);

  useEffect(() => {
    if (selectedAttribute) {
      fetchTerms(selectedAttribute.id);
    } else {
      setTerms([]);
    }
  }, [selectedAttribute]);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const data = await getAttributes();
      setAttributes(data);
    } catch (error) {
      console.error("Error fetching attributes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async (attributeId: string) => {
    setLoadingTerms(true);
    try {
      const data = await getTerms(attributeId);
      setTerms(data);
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setLoadingTerms(false);
    }
  };

  const handleCreateAttribute = async () => {
    if (!attrName) return;
    try {
      await addAttribute({
        name: attrName,
        type: attrType,
        isHierarchical: attrIsHierarchical,
        isActive: attrIsActive,
      });
      setAttributeModalVisible(false);
      resetAttrForm();
      fetchAttributes();
    } catch (error) {
      console.error("Error creating attribute:", error);
    }
  };

  const handleCreateTerm = async () => {
     if (!selectedAttribute || !termName) return;
     try {
        await addTerm({
           attributeId: selectedAttribute.id,
           name: termName,
           parentId: parentTermId,
        });
        setTermModalVisible(false);
        setTermName("");
        setParentTermId(null);
        fetchTerms(selectedAttribute.id);
     } catch (error) {
        console.error("Error creating term:", error);
     }
  };
  
  const resetAttrForm = () => {
    setAttrName("");
    setAttrType("select");
    setAttrIsHierarchical(false);
    setAttrIsActive(true);
  };

  const handleDeleteAttribute = async (id: string) => {
      try {
          await deleteAttribute(id);
          if (selectedAttribute?.id === id) setSelectedAttribute(null);
          fetchAttributes();
      } catch (error) {
          console.error("Error deleting attribute", error);
      }
  };

  const handleDeleteTerm = async (id: string) => {
      if(!selectedAttribute) return;
      try {
          await deleteTerm(id);
          fetchTerms(selectedAttribute.id);
      } catch (error) {
          console.error("Error deleting term", error);
      }
  };

  // --- Recursive Tree Render ---
  const renderTree = (
    nodes: Term[],
    parentId: string | null = null,
    level = 0
  ) => {
    const children = nodes.filter((node) => node.parentId === parentId);
    if (children.length === 0) return null;

    return children.map((node) => (
      <View key={node.id}>
        <View
          className="flex-row items-center justify-between py-2 border-b border-gray-100"
          style={{ paddingLeft: level * 20 }}
        >
          <Text className="text-gray-800">{node.name}</Text>
          <View className="flex-row gap-2">
            {selectedAttribute?.isHierarchical && (
                <TouchableOpacity
                    onPress={() => {
                        setParentTermId(node.id);
                        setTermModalVisible(true);
                    }}
                    className="bg-green-100 p-1 px-2 rounded"
                >
                    <Ionicons name="add" size={16} color="green" />
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleDeleteTerm(node.id)} className="bg-red-100 p-1 px-2 rounded">
                 <Ionicons name="trash" size={16} color="red" />
            </TouchableOpacity>
          </View>
        </View>
        {renderTree(nodes, node.id, level + 1)}
      </View>
    ));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row flex-1">
        {/* Left Col: Attributes List */}
        <View className="w-1/3 border-r border-gray-200 p-4">
          <TouchableOpacity
            className="bg-black p-3 rounded-lg mb-4 flex-row justify-center items-center"
            onPress={() => setAttributeModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-bold ml-2">{t('admin.attribute.create')}</Text>
          </TouchableOpacity>
          
          <ScrollView>
            {loading ? (
              <ActivityIndicator />
            ) : (
              attributes.map((attr) => (
                <TouchableOpacity
                  key={attr.id}
                  className={`p-3 rounded-lg mb-2 ${
                    selectedAttribute?.id === attr.id
                      ? "bg-gray-100 border border-gray-300"
                      : "bg-white"
                  }`}
                  onPress={() => setSelectedAttribute(attr)}
                >
                  <Text className="font-bold text-gray-800">{attr.name}</Text>
                  <Text className="text-xs text-gray-500">
                    {attr.type} {attr.isHierarchical ? "(Tree)" : ""}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteAttribute(attr.id)} className="absolute right-2 top-3">
                      <Ionicons name="trash-outline" size={16} color="red" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Right Col: Term Manager */}
        <View className="flex-1 p-4 bg-gray-50">
          {selectedAttribute ? (
            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                <Text className="text-xl font-bold">{selectedAttribute.name} {t('admin.attribute.terms')}</Text>
                <TouchableOpacity
                  className="bg-blue-600 py-2 px-4 rounded-lg"
                  onPress={() => {
                      setParentTermId(null);
                      setTermModalVisible(true);
                  }}
                >
                  <Text className="text-white font-bold">+ {t('admin.attribute.rootTerm')}</Text>
                </TouchableOpacity>
              </View>

              {loadingTerms ? (
                <ActivityIndicator />
              ) : (
                <ScrollView className="flex-1">
                    {selectedAttribute.isHierarchical ? (
                         renderTree(terms)
                    ) : (
                        terms.map(term => (
                            <View key={term.id} className="flex-row justify-between items-center p-3 bg-white mb-1 rounded shadow-sm">
                                <Text>{term.name}</Text>
                                <TouchableOpacity onPress={() => handleDeleteTerm(term.id)}>
                                    <Ionicons name="trash" size={18} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    {!loadingTerms && terms.length === 0 && <Text className="text-gray-500 text-center mt-10">{t('adminOrders.empty')}</Text>}
                </ScrollView>
              )}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400">{t('admin.attribute.select')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* CREATE ATTRIBUTE MODAL */}
      <Modal visible={attributeModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-xl w-3/4 shadow-xl">
            <Text className="text-xl font-bold mb-4">{t('admin.attribute.create')}</Text>
            
            <Text className="mb-1 text-gray-600">{t('admin.attribute.name')}</Text>
            <TextInput
              className="border border-gray-300 rounded p-2 mb-4"
              value={attrName}
              onChangeText={setAttrName}
              placeholder="e.g. Category, Brand, Size"
            />
            
            <Text className="mb-1 text-gray-600">{t('admin.attribute.type')}</Text>
            <View className="flex-row gap-2 mb-4">
                {['select', 'multiselect', 'range'].map((t) => (
                    <TouchableOpacity 
                        key={t}
                        onPress={() => setAttrType(t as any)}
                        className={`p-2 rounded border ${attrType === t ? 'bg-black border-black' : 'bg-white border-gray-300'}`}
                    >
                        <Text className={attrType === t ? 'text-white' : 'text-black'}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View className="flex-row justify-between items-center mb-4">
                <Text>{t('admin.attribute.hierarchical')}</Text>
                <Switch value={attrIsHierarchical} onValueChange={setAttrIsHierarchical} />
            </View>
            <View className="flex-row justify-between items-center mb-6">
                <Text>{t('admin.attribute.active')}</Text>
                <Switch value={attrIsActive} onValueChange={setAttrIsActive} />
            </View>

            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                onPress={() => setAttributeModalVisible(false)}
                className="p-3"
              >
                <Text>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateAttribute}
                className="bg-black p-3 rounded"
              >
                <Text className="text-white font-bold">{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

       {/* CREATE TERM MODAL */}
       <Modal visible={termModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-xl w-3/4 shadow-xl">
            <Text className="text-xl font-bold mb-4">
                {parentTermId ? t('admin.attribute.subTerm') : t('admin.attribute.addTerm')}
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded p-2 mb-6"
              value={termName}
              onChangeText={setTermName}
              placeholder={t('admin.attribute.termName')}
              autoFocus
            />

            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                onPress={() => setTermModalVisible(false)}
                className="p-3"
              >
                <Text>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTerm}
                className="bg-black p-3 rounded"
              >
                <Text className="text-white font-bold">{t('admin.add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
