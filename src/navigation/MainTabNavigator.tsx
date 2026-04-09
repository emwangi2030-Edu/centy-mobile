import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useHrCapabilities } from "../context/HrCapabilitiesContext";
import AttendanceScreen from "../screens/AttendanceScreen";
import HomeScreen from "../screens/HomeScreen";
import LeaveScreen from "../screens/LeaveScreen";
import MoreScreen from "../screens/MoreScreen";
import PayslipsScreen from "../screens/PayslipsScreen";

const Tab = createBottomTabNavigator();

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Payslips: "document-text-outline",
  Leave: "calendar-outline",
  Clock: "time-outline",
  More: "ellipsis-horizontal",
};

export default function MainTabNavigator() {
  const { data } = useHrCapabilities();

  const showPayslips = data.payroll.slips;
  const showLeave = data.leaves.balances || data.leaves.applications;
  const showClock =
    data.attendance.timeLogs || data.attendance.checkins || data.attendance.shifts;

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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      {showPayslips ? (
        <Tab.Screen name="Payslips" component={PayslipsScreen} options={{ title: "Payslips" }} />
      ) : null}
      {showLeave ? (
        <Tab.Screen name="Leave" component={LeaveScreen} options={{ title: "Leave" }} />
      ) : null}
      {showClock ? (
        <Tab.Screen name="Clock" component={AttendanceScreen} options={{ title: "Attendance" }} />
      ) : null}
      <Tab.Screen name="More" component={MoreScreen} options={{ title: "More" }} />
    </Tab.Navigator>
  );
}
