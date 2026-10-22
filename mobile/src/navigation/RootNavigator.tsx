import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { colors, fonts, fontSize } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  AddEntry: undefined;
};

export const webLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    initialRouteName: 'Home',
    screens: {
      Home: '',
      AddEntry: 'new',
      Login: 'login',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return (
      <View style={styles.restoring}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: fonts.semibold,
          fontSize: fontSize.body + 1,
          color: colors.text,
        },
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {status === 'signedIn' ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'MiniLedger', headerShown: false }}
          />
          <Stack.Screen
            name="AddEntry"
            component={AddEntryScreen}
            options={{ title: 'New entry' }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
