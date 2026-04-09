import AsyncStorage from "@react-native-async-storage/async-storage";

/** Same key as web `time-log-clock.tsx` so a user switching devices still has a sane single-device expectation. */
const LS_KEY = "centyhr_active_clock_in";

export type ActiveClockIn = {
  from_time: string;
  shift_assignment_name: string;
  attendance_date: string;
  shift_type: string;
};

export async function getActiveClock(): Promise<ActiveClockIn | null> {
  try {
    const raw = await AsyncStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveClockIn;
    if (!parsed?.from_time || !parsed?.shift_assignment_name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setActiveClock(value: ActiveClockIn): Promise<void> {
  await AsyncStorage.setItem(LS_KEY, JSON.stringify(value));
}

export async function clearActiveClock(): Promise<void> {
  await AsyncStorage.removeItem(LS_KEY);
}
