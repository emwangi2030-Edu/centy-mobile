import * as Location from 'expo-location';

export type CheckInLocationPayload = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  recordedAt: string;
};

/**
 * Request foreground location permission (call from the Attendance screen, in context).
 */
export async function ensureForegroundLocationPermission(): Promise<boolean> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === 'granted') {
    return true;
  }
  const asked = await Location.requestForegroundPermissionsAsync();
  return asked.status === 'granted';
}

/**
 * Returns a single fix suitable to send with check-in/out. Server must validate geofence.
 */
export async function getAttendanceLocationFix(): Promise<CheckInLocationPayload> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const { latitude, longitude, accuracy } = position.coords;
  return {
    latitude,
    longitude,
    accuracyMeters: accuracy ?? null,
    recordedAt: new Date(position.timestamp).toISOString(),
  };
}
