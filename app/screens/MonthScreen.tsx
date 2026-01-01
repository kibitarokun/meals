import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { createApiClient } from '../config/api';
import type { Meal, MealType } from '../types';

type RootStackParamList = {
  '日': { date: string; mealType?: MealType };
};

interface MealsResponse {
  meals: Meal[];
}

export default function MonthScreen() {
  const [markedDates, setMarkedDates] = useState<any>({});
  const [mealsData, setMealsData] = useState<{ [key: string]: Meal[] }>({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  useEffect(() => {
    loadMonthMeals();
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadMonthMeals();
    }
  }, [isFocused]);

  const loadMonthMeals = async () => {
    setLoading(true);
    try {
      const api = await createApiClient();
      const response = await api.get<MealsResponse>('/meals', {
        params: { days: 60 }
      });
      
      console.log('Month meals loaded:', response.data.meals?.length);
      
      const meals: Meal[] = response.data.meals || [];
      const marked: any = {};
      const mealsMap: { [key: string]: Meal[] } = {};
      
      meals.forEach((meal) => {
        marked[meal.meal_date] = {
          selected: true,
          selectedColor: '#FF6B6B',
          marked: true,
          dotColor: '#FF6B6B',
        };
        
        if (!mealsMap[meal.meal_date]) {
          mealsMap[meal.meal_date] = [];
        }
        mealsMap[meal.meal_date].push(meal);
      });
      
      setMarkedDates(marked);
      setMealsData(mealsMap);
    } catch (error) {
      Alert.alert('エラー', '献立の取得に失敗しました');
      console.error('Error loading month meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day: any) => {
    // 日付をタップしたら、その日の献立がある場合は最初の meal_type で開く
    const mealsForDay = mealsData[day.dateString];
    const mealType = mealsForDay && mealsForDay.length > 0 ? mealsForDay[0].meal_type : 'dinner';
    navigation.navigate('日', { date: day.dateString, mealType });
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
          onPress={loadMonthMeals}
        >
          <Text style={styles.refreshText}>更新</Text>
        </TouchableOpacity>
      </View>
      
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: '#FF6B6B',
          selectedDayBackgroundColor: '#FF6B6B',
          dotColor: '#FF6B6B',
          arrowColor: '#FF6B6B',
          monthTextColor: '#333',
          textMonthFontSize: 20,
          textDayFontSize: 18,
          textDayHeaderFontSize: 16,
        }}
        style={styles.calendar}
      />
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={styles.dot} />
          <Text style={styles.legendText}>献立あり ({Object.keys(mealsData).length}日)</Text>
        </View>
      </View>
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
  calendar: {
    marginTop: 10,
  },
  legendContainer: {
    padding: 20,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
  legendText: {
    fontSize: 16,
    color: '#666',
  },
});
