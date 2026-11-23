import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  useGetInsuranceGuide,
  useCalculateInsurance,
} from "@workspace/api-client-react";
import type {
  InsuranceCalculationRequestInsuranceType,
  InsuranceCalculationRequestVisitType,
  InsuranceGuide,
} from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

const INSURANCE_TYPES: { value: InsuranceCalculationRequestInsuranceType; label: string }[] = [
  { value: "nhis_employed", label: "NHIS (Workplace)" },
  { value: "nhis_self", label: "NHIS (Self-employed)" },
  { value: "uninsured", label: "Uninsured" },
];

const FACILITY_TYPES: { value: InsuranceCalculationRequestVisitType; label: string }[] = [
  { value: "clinic", label: "Clinic (의원)" },
  { value: "hospital", label: "Hospital (병원)" },
  { value: "tertiary", label: "General Hospital" },
  { value: "pharmacy", label: "Pharmacy (약국)" },
];

type CalcResult = {
  totalCost: number;
  nhisCoverage: number;
  patientCopay: number;
  copayPercentage: number;
  notes?: string[];
};

function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString("en-US")}`;
}

export default function InsuranceScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 100;

  const [activeTab, setActiveTab] = useState<"calculator" | "guide">("calculator");
  const [insType, setInsType] = useState<InsuranceCalculationRequestInsuranceType>("nhis_employed");
  const [visType, setVisType] = useState<InsuranceCalculationRequestVisitType>("clinic");
  const [cost, setCost] = useState("50000");
  const [result, setResult] = useState<CalcResult | null>(null);

  const { data: guideData } = useGetInsuranceGuide();
  const calculateMutation = useCalculateInsurance();

  const handleCalculate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    calculateMutation.mutate(
      {
        data: {
          insuranceType: insType,
          visitType: visType,
          totalCost: Number(cost) || 0,
        },
      },
      { onSuccess: (data) => setResult(data as CalcResult) }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.headerTitle}>NHIS Insurance Guide</Text>
        <Text style={styles.headerSub}>Understand your Korean health insurance coverage</Text>

        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === "calculator" && styles.tabActive]}
            onPress={() => setActiveTab("calculator")}
          >
            <MaterialCommunityIcons
              name="calculator-variant-outline"
              size={14}
              color={activeTab === "calculator" ? "#D97706" : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "calculator" && styles.tabTextActive]}>
              Calculator
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "guide" && styles.tabActive]}
            onPress={() => setActiveTab("guide")}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={activeTab === "guide" ? "#D97706" : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "guide" && styles.tabTextActive]}>
              Guide
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "calculator" ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Insurance Status</Text>
              <View style={styles.optionGroup}>
                {INSURANCE_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    style={[styles.optionBtn, insType === t.value && styles.optionBtnActive]}
                    onPress={() => { setInsType(t.value); setResult(null); }}
                  >
                    <Text style={[styles.optionText, insType === t.value && styles.optionTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Facility Type</Text>
              <View style={styles.optionGroup}>
                {FACILITY_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    style={[styles.optionBtn, visType === t.value && styles.optionBtnActive]}
                    onPress={() => { setVisType(t.value); setResult(null); }}
                  >
                    <Text style={[styles.optionText, visType === t.value && styles.optionTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estimated Total Cost</Text>
              <View style={styles.costInputWrap}>
                <Text style={styles.currencySymbol}>₩</Text>
                <TextInput
                  style={styles.costInput}
                  value={cost}
                  onChangeText={(v) => { setCost(v); setResult(null); }}
                  keyboardType="number-pad"
                  placeholder="50000"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <Text style={styles.costHint}>Enter gross amount before insurance</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.calcBtn, pressed && { opacity: 0.85 }]}
              onPress={handleCalculate}
              disabled={calculateMutation.isPending}
            >
              {calculateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="calculator-variant-outline" size={18} color="#fff" />
                  <Text style={styles.calcBtnText}>Calculate Copay</Text>
                </>
              )}
            </Pressable>

            {result && (
              <LinearGradient
                colors={["#0048B4", "#002D72"]}
                style={styles.resultCard}
              >
                <Text style={styles.resultLabel}>Your Estimated Copay</Text>
                <Text style={styles.resultCopay}>{formatKRW(result.patientCopay)}</Text>

                <View style={styles.resultBreakdown}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultRowLabel}>Total Treatment</Text>
                    <Text style={styles.resultRowValue}>{formatKRW(result.totalCost)}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <View style={styles.resultRowLeft}>
                      <Ionicons name="shield-checkmark" size={14} color="#6EE7B7" />
                      <Text style={[styles.resultRowLabel, { color: "#6EE7B7" }]}>
                        NHIS Coverage ({100 - result.copayPercentage}%)
                      </Text>
                    </View>
                    <Text style={[styles.resultRowValue, { color: "#6EE7B7" }]}>
                      -{formatKRW(result.nhisCoverage)}
                    </Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultRowLabel, { fontFamily: "Inter_700Bold", color: "#fff" }]}>
                      You Pay ({result.copayPercentage}%)
                    </Text>
                    <Text style={[styles.resultRowValue, { fontFamily: "Inter_700Bold", color: "#fff" }]}>
                      {formatKRW(result.patientCopay)}
                    </Text>
                  </View>
                </View>

                {result.notes && result.notes.length > 0 && (
                  <View style={styles.notesWrap}>
                    {result.notes.map((note, i) => (
                      <View key={i} style={styles.noteItem}>
                        <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.noteText}>{note}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            )}
          </>
        ) : (
          guideData && (
            <>
              <Text style={styles.sectionTitle}>Insurance Types</Text>
              {(guideData as InsuranceGuide).insuranceTypes?.map((t, i) => (
                <View key={i} style={styles.guideCard}>
                  <View style={styles.guideBadge}>
                    <Text style={styles.guideBadgeText}>{t.name}</Text>
                  </View>
                  <Text style={styles.guideCardTitle}>{t.description}</Text>
                  <Text style={styles.guideCardText}>{t.eligibility}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {(guideData as InsuranceGuide).faqs?.map((faq, i) => (
                <View key={i} style={styles.faqCard}>
                  <View style={styles.faqQ}>
                    <MaterialCommunityIcons name="help-circle" size={18} color={Colors.warning} />
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                  </View>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              ))}
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  headerSub: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: "#D97706",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionGroup: {
    gap: 6,
  },
  optionBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionBtnActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#D97706",
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: "#92400E",
    fontFamily: "Inter_600SemiBold",
  },
  costInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  currencySymbol: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textSecondary,
  },
  costInput: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  costHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  calcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D97706",
    borderRadius: 14,
    paddingVertical: 14,
  },
  calcBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  resultLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  resultCopay: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: "#fff",
  },
  resultBreakdown: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultRowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  resultRowValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  resultDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  notesWrap: {
    gap: 6,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  guideCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#D97706",
    gap: 6,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
  },
  guideBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  guideBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#92400E",
    textTransform: "uppercase",
  },
  guideCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  guideCardText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQ: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  faqAnswer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    paddingLeft: 26,
  },
});
