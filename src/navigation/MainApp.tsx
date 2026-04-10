import { AppModeProvider } from "../context/AppModeContext";
import { HrCapabilitiesProvider } from "../context/HrCapabilitiesContext";
import MainTabNavigator from "./MainTabNavigator";

export default function MainApp() {
  return (
    <HrCapabilitiesProvider>
      <AppModeProvider>
        <MainTabNavigator />
      </AppModeProvider>
    </HrCapabilitiesProvider>
  );
}
