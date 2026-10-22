import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator, webLinking } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const isWeb = Platform.OS === 'web';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    InstrumentSerif_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={styles.page} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.page}>
          <View style={isWeb ? styles.webColumn : styles.page}>
            <NavigationContainer linking={isWeb ? webLinking : undefined}>
              <RootNavigator />
            </NavigationContainer>
          </View>
        </View>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
