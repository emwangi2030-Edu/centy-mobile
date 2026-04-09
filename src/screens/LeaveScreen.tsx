import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LeaveScreen() {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Leave</Text>
      <Text style={styles.sub}>Coming next: balances, apply, and history via `/api/hr/v1` leave routes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: 24, backgroundColor: "#f5f6f5" },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#6b7280", lineHeight: 22 },
});
