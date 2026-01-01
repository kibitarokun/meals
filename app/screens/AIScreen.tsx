import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createApiClient } from '../config/api';

interface AIAction {
  id: string;
  title: string;
  icon: string;
  description: string;
  action: 'recent' | 'suggest' | 'popular';
}

interface AIResponse {
  message: string;
}

const AI_ACTIONS: AIAction[] = [
  {
    id: '1',
    title: '最近の献立を分析',
    icon: 'analytics',
    description: '過去2週間の献立傾向を教えます',
    action: 'recent'
  },
  {
    id: '2',
    title: '献立を提案',
    icon: 'bulb',
    description: '最近の献立と被らない提案をします',
    action: 'suggest'
  },
  {
    id: '3',
    title: '人気の献立',
    icon: 'star',
    description: 'よく作っている献立トップ5',
    action: 'popular'
  }
];

export default function AIScreen() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAIRequest = async (action: 'recent' | 'suggest' | 'popular') => {
    setLoading(true);
    setResponse('');
    
    try {
      const api = await createApiClient();
      const result = await api.post('/ai', {
        action,
        context: {}
      });
      
      setResponse((result.data as AIResponse).message || '応答がありませんでした');
    } catch (error: any) {
      console.error('AI request error:', error);
      Alert.alert('エラー', 'AI機能の利用に失敗しました');
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🧚 AIアシスタント</Text>
          <Text style={styles.headerSubtitle}>
            献立の分析や提案をお手伝いします
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {AI_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.actionCard}
              onPress={() => handleAIRequest(item.action)}
              disabled={loading}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons 
                  name={item.icon as any} 
                  size={32} 
                  color="#FF6B6B" 
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>AIが考え中...</Text>
          </View>
        )}

        {response && !loading && (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#4ECDC4" />
              <Text style={styles.responseHeaderText}>AIからの回答</Text>
            </View>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        )}

        {!response && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="hand-right" size={48} color="#CCC" />
            <Text style={styles.emptyText}>
              上のボタンを押して{'\n'}AIに質問してみましょう
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: '100%',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  responseContainer: {
    backgroundColor: '#E8F5F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginLeft: 8,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    width: '100%',
  },
  emptyContainer: {
    padding: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    width: '100%',
  },
});
