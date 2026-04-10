import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppMode } from "../context/AppModeContext";
import AdminTabNavigator from "./AdminTabNavigator";
import EmployeeTabNavigator from "./EmployeeTabNavigator";

export default function MainTabNavigator() {
  const { mode, ready } = useAppMode();
  const { canSubmitOnBehalf, isImpersonating, isImpersonatingUser, impersonatedUserName } = useAuth();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#00a865" />
      </View>
    );
  }

  const showBanner = isImpersonating || isImpersonatingUser;

  return (
    <View style={styles.root}>
      {showBanner ? (
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText}>
            {isImpersonatingUser && impersonatedUserName
              ? `You are signed in as ${impersonatedUserName}.`
              : "Impersonation session — proceed with care."}
          </Text>
        </View>
      ) : null}
      {canSubmitOnBehalf && mode === "admin" ? <AdminTabNavigator /> : <EmployeeTabNavigator />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f5" },
  boot: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f6f5" },
  banner: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(180,83,9,0.25)",
  },
  bannerText: { fontSize: 13, fontWeight: "600", color: "#92400e", textAlign: "center" },
});
