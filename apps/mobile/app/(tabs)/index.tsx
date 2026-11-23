import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Image } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetHealthRecord } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

const FEATURES = [
  {
    title: "Healix AI",
    desc: "AI-powered medical consultation",
    icon: "chat-processing-outline" as const,
    iconLib: "MaterialCommunityIcons" as const,
    color: Colors.primary,
    bg: Colors.primaryLight,
    href: "/(tabs)/chatbot" as const,
  },
  {
    title: "Clinic Finder",
    desc: "English-speaking doctors nearby",
    icon: "hospital" as const,
    iconLib: "FontAwesome5" as const,
    color: Colors.accent,
    bg: Colors.accentLight,
    href: "/(tabs)/clinics" as const,
  },
  {
    title: "Voice Translator",
    desc: "Real-time medical translation",
    icon: "translate" as const,
    iconLib: "MaterialCommunityIcons" as const,
    color: "#7C3AED",
    bg: "#EDE9FE",
    href: "/(tabs)/translator" as const,
  },
  {
    title: "NHIS Calculator",
    desc: "Estimate your medical costs",
    icon: "calculator-variant-outline" as const,
    iconLib: "MaterialCommunityIcons" as const,
    color: "#D97706",
    bg: "#FEF3C7",
    href: "/(tabs)/insurance" as const,
  },
  {
    title: "Community",
    desc: "Expat healthcare experiences",
    icon: "account-group-outline" as const,
    iconLib: "MaterialCommunityIcons" as const,
    color: "#059669",
    bg: "#D1FAE5",
    href: "/(tabs)/community" as const,
  },
  {
    title: "Health Record",
    desc: "Your personal medical profile",
    icon: "medical-bag" as const,
    iconLib: "MaterialCommunityIcons" as const,
    color: "#E11D48",
    bg: "#FFE4E6",
    href: "/(tabs)/health-record" as const,
  },
];

type FeatureIconProps =
  | { lib: "MaterialCommunityIcons"; name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; color: string }
  | { lib: "FontAwesome5"; name: React.ComponentProps<typeof FontAwesome5>["name"]; color: string }
  | { lib: "Feather"; name: React.ComponentProps<typeof Feather>["name"]; color: string };

function FeatureIcon({ lib, name, color }: FeatureIconProps) {
  if (lib === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={name} size={24} color={color} />;
  }
  if (lib === "FontAwesome5") {
    return <FontAwesome5 name={name} size={20} color={color} />;
  }
  return <Feather name={name} size={22} color={color} />;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { data: healthRecord } = useGetHealthRecord();

  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#002D72", "#0048B4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: topPadding + 20 }]}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoRow}>
            <Image
              source={require("@/assets/images/healix-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Healix</Text>
          </View>
          <Text style={styles.heroTitle}>Care Without{"\n"}Borders</Text>
          <Text style={styles.heroSubtitle}>
            Find clinics, understand insurance and get complete medical guidance in your language.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/(tabs)/chatbot")}
          >
            <MaterialCommunityIcons name="chat-processing" size={18} color={Colors.primary} />
            <Text style={styles.heroButtonText}>Consult with Healix AI</Text>
            <Feather name="chevron-right" size={18} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Clinics", value: "200+" },
            { label: "Languages", value: "5" },
            { label: "Coverage", value: "Seoul" },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {healthRecord && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <Pressable
            style={({ pressed }) => [styles.healthCard, pressed && { opacity: 0.9 }]}
            onPress={() => router.push("/(tabs)/health-record")}
          >
            <View style={styles.healthRow}>
              <View style={styles.vitalItem}>
                <Ionicons name="heart" size={20} color={Colors.danger} />
                <Text style={styles.vitalValue}>{healthRecord.vitals?.heartRate ?? "--"}</Text>
                <Text style={styles.vitalLabel}>BPM</Text>
              </View>
              <View style={styles.vitalDivider} />
              <View style={styles.vitalItem}>
                <MaterialCommunityIcons name="thermometer" size={20} color={Colors.warning} />
                <Text style={styles.vitalValue}>{healthRecord.vitals?.temperature ?? "--"}</Text>
                <Text style={styles.vitalLabel}>°C Temp</Text>
              </View>
              <View style={styles.vitalDivider} />
              <View style={styles.vitalItem}>
                <MaterialCommunityIcons name="blood-bag" size={20} color={Colors.accent} />
                <Text style={styles.vitalValue}>{healthRecord.vitals?.oxygenSaturation ?? "--"}</Text>
                <Text style={styles.vitalLabel}>% SpO2</Text>
              </View>
              <View style={styles.vitalDivider} />
              <View style={styles.vitalItem}>
                <MaterialCommunityIcons name="water" size={20} color={Colors.primary} />
                <Text style={styles.vitalValue}>{healthRecord.vitals?.bloodPressure ?? "--"}</Text>
                <Text style={styles.vitalLabel}>mmHg</Text>
              </View>
            </View>
            <View style={styles.healthCardFooter}>
              <Text style={styles.healthCardFooterText}>
                {healthRecord.fullName ?? "Health Profile"} · {healthRecord.bloodType ?? "?"}
              </Text>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </View>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <Pressable
              key={f.title}
              style={({ pressed }) => [styles.featureCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(f.href)}
            >
              <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                <FeatureIcon lib={f.iconLib} name={f.icon} color={f.color} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Medical Advice Disclaimer</Text>
            <Text style={styles.infoDesc}>
              Healix AI provides guidance only. Always consult a licensed doctor for diagnosis and treatment.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroContent: {
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  logoText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  heroTitle: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignSelf: "flex-start",
  },
  heroButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 16,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: "47%",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  healthCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  healthRow: {
    flexDirection: "row",
    padding: 16,
    gap: 4,
  },
  vitalItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  vitalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  vitalLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  vitalDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  healthCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  healthCardFooterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
  infoIconWrap: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  infoDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
