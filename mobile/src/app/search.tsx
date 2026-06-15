import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, Pressable } from 'react-native';
import axiosInstance from '../api/axiosInstance';
import RecipeCard from '../components/RecipeCard';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setRecipes([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      // The API endpoint for fetching all recipes supports a ?search parameter
      const res = await axiosInstance.get(`/api/recipes?search=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setRecipes(res.data.data.recipes);
      }
    } catch (err) {
      console.error('Failed to fetch search results', err);
      setError('Failed to fetch recipes.');
    } finally {
      setLoading(false);
    }
  };

  // Optional: debounce this in a real production app
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSearch(query);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, ingredients, cuisines..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            query.trim() ? (
              <Text style={styles.emptyText}>No recipes found for "{query}".</Text>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Discover your next favorite meal.</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: '#cc0000',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
});
