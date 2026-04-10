import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminBatchDetailScreen from "../screens/AdminBatchDetailScreen";
import AdminWalletScreen from "../screens/AdminWalletScreen";
import type { AdminWalletStackParamList } from "./adminWalletStackTypes";

const Stack = createNativeStackNavigator<AdminWalletStackParamList>();

export default function AdminWalletStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: "700" },
        headerTintColor: "#00a865",
      }}
    >
      <Stack.Screen name="WalletHome" component={AdminWalletScreen} options={{ title: "Wallet" }} />
      <Stack.Screen name="BatchDetail" component={AdminBatchDetailScreen} options={{ title: "Batch" }} />
    </Stack.Navigator>
  );
}
