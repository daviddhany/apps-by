import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { DiscoverScreen } from "../screens/DiscoverScreen";
import { CreateScreen } from "../screens/CreateScreen";
import { MyAppsScreen } from "../screens/MyAppsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { Icon } from "../components/Icon";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#c0c1ff",
        tabBarInactiveTintColor: "#c7c4d7",
        tabBarStyle: { backgroundColor: "#1a1b21", borderTopColor: "rgba(255,255,255,0.08)" },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="auto_awesome" size={size} color={color} /> }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="explore" size={size} color={color} /> }} />
      <Tab.Screen name="Create" component={CreateScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="add" size={size} color={color} /> }} />
      <Tab.Screen name="MyApps" component={MyAppsScreen} options={{ title: "My Apps", tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
