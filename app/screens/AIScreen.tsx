import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
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
    icon: '📊',
    description: '過去2週間の献立傾向を教えます',
    action: 'recent'
  },
  {
    id: '2',
    title: '献立を提案',
    icon: '💡',
    description: '最近の献立と被らない提案をします',
    action: 'suggest'
  },
  {
    id: '3',
    title: '人気の献立',
    icon: '⭐',
    description: 'よく作っている献立トップ5',
    action: 'popular'
  }
];

export default function AIScreen() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const responseViewRef = useRef<View>(null);

  useEffect(() => {
    if (response && !loading && responseViewRef.current) {
      // 回答が表示されたら少し遅延してスクロール
      setTimeout(() => {
        responseViewRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          () => { }
        );
      }, 100);
    }
  }, [response, loading]);

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

  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('入力エラー', '質問を入力してください');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const api = await createApiClient();
      const result = await api.post('/ai', {
        action: 'chat',
        question: question.trim()
      });

      setResponse((result.data as AIResponse).message || '応答がありませんでした');
      setQuestion(''); // 送信後にクリア
    } catch (error: any) {
      console.error('AI question error:', error);
      Alert.alert('エラー', '質問の送信に失敗しました');
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🧚 AIアシスタント</Text>
          <Text style={styles.headerSubtitle}>
            献立の分析や提案をお手伝いします
          </Text>
        </View>
        <View style={styles.questionSection}>
          <Text style={styles.sectionTitle}>💬 自由に質問</Text>
          <View style={styles.questionInputContainer}>
            <TextInput
              style={styles.questionInput}
              placeholder="例: 今日は何を作ればいい？"
              placeholderTextColor="#999"
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={2}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={handleQuestionSubmit}
              disabled={loading}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.sectionTitle}>🎯 定型質問</Text>
        <View style={styles.actionsContainer}>
          {AI_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.actionCard}
              onPress={() => handleAIRequest(item.action)}
              disabled={loading}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>{item.icon}</Text>
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
        {response !== '' && !loading && (
          <View ref={responseViewRef} style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#4ECDC4" />
              <Text style={styles.responseHeaderText}>AIからの回答</Text>
            </View>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        )}
        {response === '' && !loading && (
          <View style={styles.emptyContainer}>
            {/* <Ionicons name="hand-right" size={48} color="#CCC" /> */}
            <Text style={styles.emptyText}>
              自由に質問するか、{"\n"}定型質問を選んでください
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  actionIcon: {
    fontSize: 32,
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
  questionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  questionInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    fontSize: 24,
    color: '#FFF',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
});
