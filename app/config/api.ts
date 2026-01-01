import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const API_BASE_URL = 'https://meals-backend.mia-daydream.workers.dev';

const API_KEY_STORAGE_KEY = 'FAMILY_SECRET';

export const getApiKey = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
};

export const saveApiKey = async (key: string): Promise<void> => {
  await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const createApiClient = async () => {
  const apiKey = await getApiKey();
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-KEY': apiKey })
    }
  });
};
