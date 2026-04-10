import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AdminApprovalsScreen from "../screens/AdminApprovalsScreen";
import AdminWalletStack from "./AdminWalletStack";
import MoreScreen from "../screens/MoreScreen";

const Tab = createBottomTabNavigator();

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Wallet: "wallet-outline",
  Approvals: "checkmark-done-outline",
  More: "ellipsis-horizontal",
};

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: "#00a865",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name] ?? "ellipse-outline"} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Wallet" component={AdminWalletStack} options={{ headerShown: false }} />
      <Tab.Screen name="Approvals" component={AdminApprovalsScreen} options={{ title: "Approvals" }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ title: "More" }} />
    </Tab.Navigator>
  );
}
