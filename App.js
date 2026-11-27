import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from './src/store';
import { useTheme, shadow } from './src/theme';
import { ToastHost, Icon, T, useLang } from './src/components/ui';
import { tr } from './src/i18n';
import { LockGate } from './src/lock';

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
import ReportsScreen from './src/screens/ReportsScreen';
import ExpenseFormScreen from './src/screens/ExpenseFormScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import CustomerScreen from './src/screens/CustomerScreen';
import PaymentReceiptScreen from './src/screens/PaymentReceiptScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ionicons names; the open tab shows the filled icon, the others the "-outline" version.
const TAB_ICONS = { Home: 'home', Bookings: 'calendar', Staff: 'people', Payments: 'wallet', Bills: 'receipt' };

// White bar docked to the bottom; the open tab is shown in the accent colour.
function TabBar({ state, descriptors, navigation }) {
  const c = useTheme();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          position: 'absolute', left: 0, right: 0, bottom: 0,
          flexDirection: 'row', backgroundColor: c.tabBg, paddingTop: 8, paddingBottom: insets.bottom + 8, paddingHorizontal: 6,
          borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, borderColor: c.line,
        },
        shadow,
        { shadowOpacity: 0.1, shadowOffset: { width: 0, height: -4 }, elevation: 12 },
      ]}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        // Tab names stay fixed even when a screen changes its header title (Home shows the business name).
        const label = tr(descriptors[route.key].options.tabBarLabel || route.name, lang);
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}
          >
            <View style={{ width: 46, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? c.plumBg : 'transparent' }}>
              <Icon name={TAB_ICONS[route.name] + (focused ? '' : '-outline')} size={21} color={focused ? c.accent : c.muted} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? c.accent : c.muted, marginTop: 2 }}>{label}</Text>
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
    headerTitleStyle: { fontWeight: '800', fontSize: 22, color: c.fg },
    headerTitleAlign: 'left',
    headerTitle: ({ children }) => <T weight="800" size={22} numberOfLines={1}>{children}</T>,
  };
  return (
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={header}>
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
    // Header titles go through <T> so they follow the app language.
    headerTitle: ({ children }) => <T weight="800" size={18} numberOfLines={1}>{children}</T>,
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
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Customers" component={CustomersScreen} />
        <Stack.Screen name="Customer" component={CustomerScreen} options={{ title: 'Customer' }} />
        <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} options={{ title: 'Payment receipt' }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Profit & loss' }} />
        <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ presentation: 'modal', title: 'Expense' }} />
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
        <LockGate>
          <Root />
        </LockGate>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
