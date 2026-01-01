import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { createApiClient } from '../config/api';
import type { Meal, Comment, MealType } from '../types';

interface MealsResponse {
  meals?: Meal[];
}

interface CommentsResponse {
  comments?: Comment[];
}

const QUICK_COMMENTS = [
  '楽しみ！',
  'ごちそうさま！',
  '美味しそう✨',
  'いいね👍',
];

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: '朝食', emoji: '🌅' },
  { value: 'lunch', label: '昼食', emoji: '☀️' },
  { value: 'dinner', label: '夕食', emoji: '🌙' },
];

export default function DayScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { date?: string; mealType?: MealType } | undefined;
  
  const [selectedDate, setSelectedDate] = useState(
    params?.date || new Date().toISOString().split('T')[0]
  );
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    params?.mealType || 'dinner'
  );
  const [menuName, setMenuName] = useState('');
  const [memo, setMemo] = useState('');
  const [comment, setComment] = useState('');
  const [existingMeal, setExistingMeal] = useState<Meal | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params?.date) {
      setSelectedDate(params.date);
    }
    if (params?.mealType) {
      setSelectedMealType(params.mealType);
    }
  }, [params?.date, params?.mealType]);

  useEffect(() => {
    loadMealData();
  }, [selectedDate, selectedMealType]);

  const loadMealData = async () => {
    setLoading(true);
    try {
      const api = await createApiClient();
      
      // 献立データ取得
      const mealsResponse = await api.get<MealsResponse>('/meals', {
        params: { days: 60 }
      });
      const meal = mealsResponse.data.meals?.find(
        (m: Meal) => m.meal_date === selectedDate && m.meal_type === selectedMealType
      );
      
      if (meal) {
        setExistingMeal(meal);
        setMenuName(meal.menu_name);
        setMemo(meal.memo || '');
      } else {
        setExistingMeal(null);
        setMenuName('');
        setMemo('');
      }

      // コメント取得
      const commentsResponse = await api.get<CommentsResponse>('/comments', {
        params: { date: selectedDate, meal_type: selectedMealType }
      });
      setComments(commentsResponse.data.comments || []);
    } catch (error) {
      console.error('Error loading meal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMeal = async () => {
    if (!menuName.trim()) {
      Alert.alert('エラー', '献立名を入力してください');
      return;
    }

    try {
      const api = await createApiClient();
      await api.post('/meals', {
        meal_date: selectedDate,
        meal_type: selectedMealType,
        menu_name: menuName.trim(),
        memo: memo.trim() || null
      });

      Alert.alert('成功', '献立を保存しました！');
      await loadMealData(); // データ再読み込み
    } catch (error) {
      Alert.alert('エラー', '献立の保存に失敗しました');
      console.error(error);
    }
  };

  const postComment = async (commentText: string) => {
    try {
      const api = await createApiClient();
      await api.post('/comments', {
        meal_date: selectedDate,
        meal_type: selectedMealType,
        comment_text: commentText
      });

      Alert.alert('成功', 'コメントを投稿しました！');
      setComment('');
      await loadMealData(); // データ再読み込み
    } catch (error) {
      Alert.alert('エラー', 'コメントの投稿に失敗しました');
      console.error(error);
    }
  };

  const deleteMeal = async () => {
    Alert.alert(
      '献立を削除',
      '本当にこの献立を削除しますか？\nコメントも全て削除されます。',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const api = await createApiClient();
              await api.delete('/meals', {
                params: { date: selectedDate, meal_type: selectedMealType }
              });

              Alert.alert('成功', '献立を削除しました');
              navigation.goBack();
            } catch (error) {
              Alert.alert('エラー', '献立の削除に失敗しました');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 日付</Text>
          <Text style={styles.dateDisplay}>{selectedDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 食事の種類</Text>
          <View style={styles.mealTypeContainer}>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.mealTypeButton,
                  selectedMealType === type.value && styles.mealTypeButtonActive
                ]}
                onPress={() => setSelectedMealType(type.value)}
              >
                <Text style={styles.mealTypeEmoji}>{type.emoji}</Text>
                <Text
                  style={[
                    styles.mealTypeText,
                    selectedMealType === type.value && styles.mealTypeTextActive
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {existingMeal && (
          <View style={styles.existingMealCard}>
            <Text style={styles.existingMealLabel}>✅ 登録済みの献立</Text>
            <Text style={styles.existingMealName}>{existingMeal.menu_name}</Text>
            {existingMeal.memo && (
              <Text style={styles.existingMealMemo}>{existingMeal.memo}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ 献立名</Text>
          <TextInput
            style={[styles.input, { fontSize: 20 }]}
            placeholder="例: カレーライス"
            placeholderTextColor="#CCC"
            value={menuName}
            onChangeText={setMenuName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 メモ（任意）</Text>
          <TextInput
            style={[styles.input, styles.memoInput, { fontSize: 18 }]}
            placeholder="例: 辛口で作りました"
            placeholderTextColor="#CCC"
            value={memo}
            onChangeText={setMemo}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveMeal}>
          <Text style={styles.saveButtonText}>
            {existingMeal ? '献立を更新' : '献立を保存'}
          </Text>
        </TouchableOpacity>

        {existingMeal && (
          <TouchableOpacity style={styles.deleteButton} onPress={deleteMeal}>
            <Text style={styles.deleteButtonText}>献立を削除</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 ひとことコメント</Text>
          
          {comments.length > 0 && (
            <View style={styles.commentsListContainer}>
              <Text style={styles.commentsListTitle}>これまでのコメント</Text>
              {comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Text style={styles.commentItemText}>{c.comment_text}</Text>
                  <Text style={styles.commentItemTime}>
                    {new Date(c.created_at).toLocaleString('ja-JP')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TextInput
            style={[styles.input, { fontSize: 18 }]}
            placeholder="自由にコメントを入力"
            placeholderTextColor="#CCC"
            value={comment}
            onChangeText={setComment}
          />
          
          <TouchableOpacity 
            style={styles.commentButton}
            onPress={() => comment.trim() && postComment(comment.trim())}
          >
            <Text style={styles.commentButtonText}>コメントを投稿</Text>
          </TouchableOpacity>

          <Text style={styles.quickLabel}>定型文を選ぶ</Text>
          <View style={styles.quickButtonsContainer}>
            {QUICK_COMMENTS.map((text) => (
              <TouchableOpacity
                key={text}
                style={styles.quickButton}
                onPress={() => postComment(text)}
              >
                <Text style={styles.quickButtonText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  existingMealCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#81C784',
  },
  existingMealLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  existingMealName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  existingMealMemo: {
    fontSize: 16,
    color: '#558B2F',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    width: '100%',
  },
  dateDisplay: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFE0E0',
  },
  mealTypeButtonActive: {
    backgroundColor: '#FFE0E0',
    borderColor: '#FF6B6B',
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  mealTypeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  mealTypeTextActive: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#333',
    borderWidth: 2,
    borderColor: '#FFE0E0',
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#999',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#FFE0E0',
    marginVertical: 24,
  },
  commentsListContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  commentsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentItemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  commentItemTime: {
    fontSize: 12,
    color: '#999',
  },
  commentButton: {
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 12,
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  quickButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
