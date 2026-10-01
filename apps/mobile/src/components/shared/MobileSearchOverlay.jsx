import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock, ArrowUpLeft, Music } from 'lucide-react-native';

export default function MobileSearchOverlay({
  isOpen,
  onClose,
  onSearch,
  suggestions = [],
  recentSearches = [],
  onSelectSuggestion,
}) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0e0e0e]" edges={['top', 'bottom']}>
      {/* Search Bar Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-white/5">
        <View className="flex-1 flex-row items-center bg-[#161616] rounded-2xl px-3.5 py-2 border border-white/10">
          <Search size={18} color="#737373" className="mr-2" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor="#737373"
            returnKeyType="search"
            autoFocus
            className="flex-1 text-sm text-white font-medium p-0"
          />
          {query.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQuery('')}
              className="p-1"
            >
              <X size={16} color="#737373" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          className="py-2 px-1"
        >
          <Text className="text-sm font-semibold text-neutral-400">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Autocomplete / Recent Suggestions */}
      <ScrollView className="flex-1 px-4 py-2" keyboardShouldPersistTaps="handled">
        {/* Real-time query predictions */}
        {suggestions.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs font-mono uppercase tracking-widest text-neutral-500 py-2">
              Suggestions
            </Text>
            {suggestions.map((item, index) => {
              const text = typeof item === 'string' ? item : item.query || item.title;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => {
                    setQuery(text);
                    onSelectSuggestion?.(text);
                  }}
                  className="flex-row items-center justify-between py-3 border-b border-white/5"
                >
                  <View className="flex-row items-center gap-3 flex-1 min-w-0">
                    <Search size={16} color="#737373" />
                    <Text numberOfLines={1} className="text-sm font-medium text-white flex-1">
                      {text}
                    </Text>
                  </View>
                  <ArrowUpLeft size={16} color="#525252" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Searches */}
        {suggestions.length === 0 && recentSearches.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs font-mono uppercase tracking-widest text-neutral-500 py-2">
              Recent Searches
            </Text>
            {recentSearches.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => {
                  setQuery(item);
                  onSelectSuggestion?.(item);
                }}
                className="flex-row items-center justify-between py-3 border-b border-white/5"
              >
                <View className="flex-row items-center gap-3 flex-1 min-w-0">
                  <Clock size={16} color="#737373" />
                  <Text numberOfLines={1} className="text-sm font-medium text-neutral-300 flex-1">
                    {item}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
