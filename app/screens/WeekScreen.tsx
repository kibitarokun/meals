import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { createApiClient } from '../config/api';
import type { Meal, MealType } from '../types';

type RootStackParamList = {
  '日': { date: string; mealType: MealType };
  '週': undefined;
  '月': undefined;
};

interface MealsResponse {
  meals: Meal[];
}

export default function WeekScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  useEffect(() => {
    loadWeekMeals();
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadWeekMeals();
    }
  }, [isFocused]);

  const loadWeekMeals = async () => {
    try {
      const api = await createApiClient();
      const response = await api.get<MealsResponse>('/meals', {
        params: { days: 7 }
      });
      
      setMeals(response.data.meals || []);
    } catch (error) {
      Alert.alert('エラー', '献立の取得に失敗しました');
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  const getMealTypeLabel = (mealType: MealType) => {
    const labels = {
      breakfast: '🌅朝食',
      lunch: '☀️昼食',
      dinner: '🌙夕食'
    };
    return labels[mealType] || '';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={loadWeekMeals}
        >
          <Text style={styles.refreshText}>更新</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>まだ献立がありません</Text>
            <Text style={styles.emptySubText}>カレンダーから日付を選択して追加してください</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <TouchableOpacity 
              key={`${meal.meal_date}-${meal.meal_type}`}
              style={styles.card}
              onPress={() => navigation.navigate('日', { date: meal.meal_date, mealType: meal.meal_type })}
            >
              <Text style={styles.dateText}>{formatDate(meal.meal_date)} {getMealTypeLabel(meal.meal_type)}</Text>
              <Text style={styles.menuText}>{meal.menu_name}</Text>
              {meal.latest_comment && (
                <View style={styles.commentContainer}>
                  <Text style={styles.commentLabel}>💬 最新のひとこと</Text>
                  <Text style={styles.commentText}>{meal.latest_comment}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  header: {
    padding: 12,
    alignItems: 'flex-end',
    backgroundColor: '#FFF8F0',
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  refreshText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
    width: '100%',
  },
  emptyText: {
    fontSize: 20,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  emptySubText: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  commentContainer: {
    backgroundColor: '#FFF8F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  commentLabel: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    color: '#666',
  },
});
