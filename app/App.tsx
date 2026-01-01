import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MonthScreen from './screens/MonthScreen';
import WeekScreen from './screens/WeekScreen';
import DayScreen from './screens/DayScreen';
import AIScreen from './screens/AIScreen';
import { getApiKey, saveApiKey } from './config/api';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const key = await getApiKey();
    if (key) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  const handleSaveApiKey = async () => {
    if (apiKey.trim()) {
      await saveApiKey(apiKey.trim());
      setIsAuthenticated(true);
      Alert.alert('設定完了', 'APIキーを保存しました');
    } else {
      Alert.alert('エラー', 'APIキーを入力してください');
    }
  };

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>うちの晩ごはん</Text>
        <Text style={styles.subtitle}>家族の秘密鍵を入力してください</Text>
        <TextInput
          style={styles.input}
          placeholder="FAMILY_SECRET"
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
          secureTextEntry
        />
        <Button title="保存" onPress={handleSaveApiKey} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="日" 
          component={DayScreen}
          options={{ 
            headerShown: true,
            title: '献立の詳細',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { height: 70, paddingBottom: 10 },
        tabBarLabelStyle: { fontSize: 16, fontWeight: 'bold' },
        headerShown: true,
        headerTitleStyle: { fontSize: 20, fontWeight: 'bold' }
      }}
    >
      <Tab.Screen 
        name="週" 
        component={WeekScreen}
        options={{ 
          title: '今週の献立',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="月" 
        component={MonthScreen}
        options={{ 
          title: 'カレンダー',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="AI" 
        component={AIScreen}
        options={{ 
          title: 'AIアシスタント',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
});
