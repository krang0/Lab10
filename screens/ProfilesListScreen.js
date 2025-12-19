import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl, // Yenileme kontrolü eklendi
} from 'react-native';
import { api } from '../api/client';

export default function ProfilesListScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Yenileme durumu

  const fetchProfiles = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/profiles?page=${page}&limit=10`);

      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setProfiles((prev) => [...prev, ...res.data]);
        setPage((prev) => prev + 1);
      }
    } catch (err) {
      // Hata mesajını API'den gelen düzenlenmiş mesajdan alıyoruz
      setError(err.message || 'Profiller yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Aşağı çekince çalışacak fonksiyon
  const onRefresh = async () => {
    setRefreshing(true);
    // State'leri sıfırla
    setProfiles([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    // Veriyi tekrar çek (farklı bir mantıkla çağırıyoruz)
    try {
        // İlk sayfayı çekiyoruz manuel olarak
        const res = await api.get(`/profiles?page=1&limit=10`);
        setProfiles(res.data);
        setPage(2);
        if (res.data.length === 0) setHasMore(false);
    } catch (err) {
        setError(err.message || 'Yenileme başarısız');
    } finally {
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('ProfileDetail', { id: item.id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.email}>{item.email}</Text>
    </Pressable>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Hiç profil bulunamadı</Text>
        </View>
    );
  };

  // İlk yükleme animasyonu (Sayfa boşken)
  if (loading && profiles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Profiller yükleniyor...</Text>
      </View>
    );
  }

  // Sadece hata varsa ve hiç veri yoksa gösterilecek ekran
  if (error && profiles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchProfiles}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={fetchProfiles}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    flexGrow: 1, // Boş ekranın ortalanması için önemli
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});