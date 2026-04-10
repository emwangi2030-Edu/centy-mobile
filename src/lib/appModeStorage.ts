import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "centy_app_mode_v1";

export type AppMode = "employee" | "admin";

export async function readStoredAppMode(): Promise<AppMode | null> {
  const v = await AsyncStorage.getItem(KEY);
  if (v === "admin" || v === "employee") return v;
  return null;
}

export async function writeStoredAppMode(mode: AppMode): Promise<void> {
  await AsyncStorage.setItem(KEY, mode);
}

export async function clearStoredAppMode(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
