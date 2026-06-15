import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView, Alert } from 'react-native';
import axiosInstance from '../api/axiosInstance';
import UseAuthStore from '../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, isAuthenticated, login, logout } = UseAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    try {
      setLoading(true);
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="restaurant" size={64} color="#0066cc" style={styles.authIcon} />
        <Text style={styles.authTitle}>Welcome to Chef's Diary</Text>
        <Text style={styles.authSubtitle}>Sign in to save recipes and build your profile.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnPrimaryText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Authenticated Profile View
  const avatar = user?.avatarUrl ? { uri: user.avatarUrl } : require('@/assets/images/react-logo.png');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={avatar} style={styles.avatar} />
        <Text style={styles.name}>{user?.displayName || user?.username}</Text>
        <Text style={styles.title}>{user?.culinaryTitle || 'Home Chef'}</Text>
        
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.recipeCount || 0}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <Pressable style={styles.btnSecondary} onPress={logout}>
          <Text style={styles.btnSecondaryText}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 60 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, backgroundColor: '#eee' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  title: { fontSize: 16, color: '#0066cc', marginTop: 4, fontWeight: '500' },
  bio: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  stats: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  btnSecondary: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#cc0000' },
  btnSecondaryText: { color: '#cc0000', fontSize: 16, fontWeight: 'bold' },
  
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  authIcon: { marginBottom: 24 },
  authTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  authSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  form: { width: '100%', gap: 16 },
  input: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, fontSize: 16, color: '#333' },
  btnPrimary: { backgroundColor: '#0066cc', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
