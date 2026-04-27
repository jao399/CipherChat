import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from './src/navigation/AppNavigator';
import { BackendProvider } from './src/services/api/BackendProvider';

export default function App() {
  return (
    <BackendProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </BackendProvider>
  );
}
