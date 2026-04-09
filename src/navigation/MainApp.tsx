import { HrCapabilitiesProvider } from "../context/HrCapabilitiesContext";
import MainTabNavigator from "./MainTabNavigator";

export default function MainApp() {
  return (
    <HrCapabilitiesProvider>
      <MainTabNavigator />
    </HrCapabilitiesProvider>
  );
}
