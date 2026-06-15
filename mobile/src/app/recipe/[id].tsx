import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';

export default function RecipeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/recipes/${id}`);
      if (res.data.success) {
        setRecipe(res.data.data.recipe);
      }
    } catch (err) {
      console.error('Failed to fetch recipe', err);
      setError('Could not load this recipe. It may have been removed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#cc0000" />
        <Text style={styles.errorText}>{error || 'Recipe not found.'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const coverImage = recipe.coverImageUrl 
    ? { uri: recipe.coverImageUrl }
    : require('@/assets/images/react-logo.png'); // Fallback image

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{recipe.title}</Text>
        <Pressable style={styles.iconButton}>
          <Ionicons name="bookmark-outline" size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={coverImage} style={styles.coverImage} resizeMode="cover" />
        
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.authorLine}>
            By {recipe.author?.displayName || recipe.author?.username}
            {recipe.author?.culinaryTitle ? ` • ${recipe.author.culinaryTitle}` : ''}
          </Text>

          {/* Badges / Meta info */}
          <View style={styles.metaRow}>
            {recipe.difficulty && (
              <View style={styles.badge}>
                <Ionicons name="restaurant-outline" size={14} color="#0066cc" />
                <Text style={styles.badgeText}>{recipe.difficulty}</Text>
              </View>
            )}
            {recipe.totalTime > 0 && (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={14} color="#0066cc" />
                <Text style={styles.badgeText}>{recipe.totalTime} min</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="heart-outline" size={14} color="#0066cc" />
              <Text style={styles.badgeText}>{recipe.likeCount || 0}</Text>
            </View>
          </View>

          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          {/* Emotional Context */}
          {(recipe.emotionalContext?.mood || recipe.emotionalContext?.culturalOrigin) && (
            <View style={styles.contextBox}>
              <Text style={styles.sectionTitle}>Story & Context</Text>
              {recipe.emotionalContext.mood && (
                <Text style={styles.contextItem}>Mood: {recipe.emotionalContext.mood}</Text>
              )}
              {recipe.emotionalContext.culturalOrigin && (
                <Text style={styles.contextItem}>Origin: {recipe.emotionalContext.culturalOrigin}</Text>
              )}
              {recipe.emotionalContext.story && (
                <Text style={styles.contextStory}>{recipe.emotionalContext.story}</Text>
              )}
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ingredient: any, index: number) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>• {ingredient.name}</Text>
                <Text style={styles.ingredientQuantity}>
                  {ingredient.quantity} {ingredient.unit}
                </Text>
              </View>
            ))}
            {(!recipe.ingredients || recipe.ingredients.length === 0) && (
              <Text style={styles.emptyText}>No ingredients listed.</Text>
            )}
          </View>

          {/* Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.steps?.map((step: any, index: number) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumberBox}>
                  <Text style={styles.stepNumberText}>{step.order || index + 1}</Text>
                </View>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
              </View>
            ))}
            {(!recipe.steps || recipe.steps.length === 0) && (
              <Text style={styles.emptyText}>No instructions listed.</Text>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  authorLine: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    color: '#0066cc',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 24,
  },
  contextBox: {
    backgroundColor: '#fdf8f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f4a261',
  },
  contextItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  contextStory: {
    marginTop: 8,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  ingredientQuantity: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumberBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepInstruction: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#cc0000',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
