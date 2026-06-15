import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import axiosInstance from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function NetworkScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/api/network/feed');
      if (res.data.posts) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch network feed', err);
      setError('Could not load feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const renderPost = ({ item }: { item: any }) => {
    const avatar = item.author?.avatar 
      ? { uri: item.author.avatar } 
      : require('@/assets/images/react-logo.png');

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={avatar} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>
              {item.author?.displayName || item.author?.username || 'Unknown Chef'}
            </Text>
            <Text style={styles.postTime}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.attachedRecipe && (
          <View style={styles.attachedRecipe}>
            <Ionicons name="restaurant" size={16} color="#0066cc" />
            <Text style={styles.recipeTitle}>{item.attachedRecipe.title}</Text>
          </View>
        )}

        <View style={styles.postFooter}>
          <View style={styles.action}>
            <Ionicons name={item.isLiked ? "heart" : "heart-outline"} size={20} color={item.isLiked ? "#e0245e" : "#666"} />
            <Text style={styles.actionText}>{item.likeCount || 0}</Text>
          </View>
          <View style={styles.action}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionText}>{item.commentCount || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading network...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Chef Network</Text>
            <Text style={styles.subtitle}>See what other chefs are up to</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  listContainer: { padding: 16 },
  header: { marginBottom: 20, marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { fontSize: 16, color: '#cc0000' },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#eee' },
  authorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  postTime: { fontSize: 12, color: '#888', marginTop: 2 },
  postContent: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
  attachedRecipe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recipeTitle: { marginLeft: 8, fontSize: 14, color: '#0066cc', fontWeight: '500' },
  postFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, gap: 24 },
  action: { flexDirection: 'row', alignItems: 'center' },
  actionText: { marginLeft: 6, fontSize: 14, color: '#666' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 16, fontSize: 16 },
});
