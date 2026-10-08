import { Platform } from 'react-native';

// Determina o host padrao de acordo com o ambiente (Emulador Android usa 10.0.2.2, Web/iOS usa localhost)
const getDefaultApiHost = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiHost();
