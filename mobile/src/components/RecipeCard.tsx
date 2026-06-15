import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface Author {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  culinaryTitle?: string;
}

interface Recipe {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  author: Author;
  emotionalContext?: {
    mood?: string;
    culturalOrigin?: string;
  };
  likeCount?: number;
  difficulty?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export default function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const router = useRouter();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/recipe/${recipe.slug || recipe._id}` as any);
    }
  };

  const coverImage = recipe.coverImageUrl 
    ? { uri: recipe.coverImageUrl }
    : require('@/assets/images/react-logo.png'); // Fallback image

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <Image source={coverImage} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        
        <Text style={styles.author}>
          By {recipe.author?.displayName || recipe.author?.username}
          {recipe.author?.culinaryTitle ? ` • ${recipe.author.culinaryTitle}` : ''}
        </Text>

        {recipe.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {recipe.emotionalContext?.mood ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{recipe.emotionalContext.mood}</Text>
            </View>
          ) : null}
          
          <View style={styles.stats}>
            <Text style={styles.statText}>❤️ {recipe.likeCount || 0}</Text>
            {recipe.difficulty ? (
              <Text style={styles.statText}>🍳 {recipe.difficulty}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#0066cc',
    textTransform: 'capitalize',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
});
