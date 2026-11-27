import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from './src/store';
import { useTheme, shadow } from './src/theme';
import { ToastHost } from './src/components/ui';

import HomeScreen from './src/screens/HomeScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import BookingFormScreen from './src/screens/BookingFormScreen';
import StaffScreen from './src/screens/StaffScreen';
import StaffDetailScreen from './src/screens/StaffDetailScreen';
import StaffFormScreen from './src/screens/StaffFormScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import LedgerFormScreen from './src/screens/LedgerFormScreen';
import BillsScreen from './src/screens/BillsScreen';
import BillScreen from './src/screens/BillScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import ItemFormScreen from './src/screens/ItemFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Home: '⌂', Bookings: '▦', Staff: '☺', Payments: '₹', Bills: '≣' };

function FloatingTabBar({ state, descriptors, navigation }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 10,
          flexDirection: 'row', backgroundColor: c.surface, borderRadius: 24, padding: 6,
          borderWidth: 1, borderColor: c.line,
        },
        shadow,
        { shadowOpacity: 0.16, elevation: 8 },
      ]}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const label = descriptors[route.key].options.title || route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 18, backgroundColor: focused ? c.accent : 'transparent' }}
          >
            <Text style={{ fontSize: 19, color: focused ? c.accentInk : c.muted, fontWeight: '800' }}>{TAB_ICONS[route.name]}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: focused ? c.accentInk : c.muted, marginTop: 1 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Tabs() {
  const c = useTheme();
  const header = {
    headerStyle: { backgroundColor: c.bg },
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: '800', fontSize: 20, color: c.fg },
  };
  return (
    <Tab.Navigator tabBar={(p) => <FloatingTabBar {...p} />} screenOptions={header}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Staff" component={StaffScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Bills" component={BillsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const c = useTheme();
  const base = c.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: c.bg, card: c.bg, text: c.fg, primary: c.accent, border: c.line } };
  const header = {
    headerStyle: { backgroundColor: c.bg },
    headerShadowVisible: false,
    headerTintColor: c.fg,
    headerTitleStyle: { fontWeight: '800', color: c.fg },
    headerBackTitle: 'Back',
  };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={header}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Booking" component={BookingDetailScreen} />
        <Stack.Screen name="BookingForm" component={BookingFormScreen} options={{ presentation: 'modal', title: 'Booking' }} />
        <Stack.Screen name="StaffMember" component={StaffDetailScreen} options={{ title: 'Staff' }} />
        <Stack.Screen name="StaffForm" component={StaffFormScreen} options={{ presentation: 'modal', title: 'Staff' }} />
        <Stack.Screen name="LedgerForm" component={LedgerFormScreen} options={{ presentation: 'modal', title: 'Payment' }} />
        <Stack.Screen name="Bill" component={BillScreen} />
        <Stack.Screen name="Stock" component={InventoryScreen} />
        <Stack.Screen name="Item" component={ItemDetailScreen} options={{ title: 'Stock item' }} />
        <Stack.Screen name="ItemForm" component={ItemFormScreen} options={{ presentation: 'modal', title: 'Stock item' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Business details' }} />
      </Stack.Navigator>
      <ToastHost />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
