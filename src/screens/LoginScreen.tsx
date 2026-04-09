import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getPayHubBaseUrl } from "../config/env";

const G = "#00a865";

export default function LoginScreen() {
  const { login, verify2FA, cancel2FA, twoFactor, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const baseUrl = getPayHubBaseUrl();

  async function onSubmit() {
    if (!baseUrl) return;
    clearError();
    setBusy(true);
    try {
      if (twoFactor) {
        await verify2FA(code);
        setCode("");
      } else {
        await login(email, password);
      }
    } catch {
      /* error surfaced via context */
    } finally {
      setBusy(false);
    }
  }

  if (!baseUrl) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Configure Pay Hub</Text>
        <Text style={styles.hint}>
          Create a `.env` file with EXPO_PUBLIC_PAYHUB_BASE_URL (no trailing slash), then restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.logo}>Centy</Text>
        <Text style={styles.sub}>Employee sign in</Text>

        {twoFactor ? (
          <>
            <Text style={styles.label}>
              {twoFactor.method === "email_otp" ? "Code from email" : "Authenticator code"}
            </Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              keyboardType="number-pad"
              autoCapitalize="none"
              editable={!busy}
            />
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={() => void onSubmit()}
              disabled={busy || code.trim().length < 4}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
            </Pressable>
            <Pressable onPress={cancel2FA} disabled={busy} style={styles.linkWrap}>
              <Text style={styles.link}>Back to login</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!busy}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              editable={!busy}
            />
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={() => void onSubmit()}
              disabled={busy || !email.trim() || !password}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
            </Pressable>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.muted} numberOfLines={1}>
          {baseUrl}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  container: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: "#fff" },
  logo: { fontSize: 32, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  sub: { fontSize: 15, color: "#6b7280", marginBottom: 28 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  hint: { fontSize: 14, color: "#6b7280", lineHeight: 22 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  button: {
    backgroundColor: G,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { color: "#dc2626", marginTop: 16, fontSize: 14 },
  muted: { marginTop: 24, fontSize: 11, color: "#9ca3af" },
  linkWrap: { marginTop: 16, alignSelf: "center" },
  link: { color: G, fontSize: 15, fontWeight: "600" },
});
