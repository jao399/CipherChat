import { StatusBar } from 'expo-status-bar';

import { LanguageProvider } from './src/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';
import { BackendProvider } from './src/services/api/BackendProvider';

export default function App() {
  return (
    <LanguageProvider>
      <BackendProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </BackendProvider>
    </LanguageProvider>
  );
}
