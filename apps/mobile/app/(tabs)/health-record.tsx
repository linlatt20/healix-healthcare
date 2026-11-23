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
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useGetHealthRecord, useGetVisits, useAddVisit } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString("en-US")}`;
}

type Allergy = { id: number; allergen: string; severity: string };
type Vitals = {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
};
type HealthRecord = {
  fullName: string;
  nationality?: string;
  dateOfBirth?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  nhisNumber?: string;
  allergies?: Allergy[];
  vitals?: Vitals;
};

type Visit = {
  id: number;
  clinicName: string;
  department?: string;
  date: string;
  diagnosis?: string;
  cost?: number;
};

type VitalCardProps =
  | {
      lib: "Ionicons";
      icon: React.ComponentProps<typeof Ionicons>["name"];
      label: string;
      value: string;
      unit: string;
      color: string;
      bg: string;
    }
  | {
      lib: "MaterialCommunityIcons";
      icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
      label: string;
      value: string;
      unit: string;
      color: string;
      bg: string;
    };

function VitalCard({ lib, icon, label, value, unit, color, bg }: VitalCardProps) {
  return (
    <View style={[vitalStyles.card, { borderTopColor: color }]}>
      <View style={[vitalStyles.icon, { backgroundColor: bg }]}>
        {lib === "Ionicons" ? (
          <Ionicons name={icon} size={18} color={color} />
        ) : (
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        )}
      </View>
      <Text style={vitalStyles.value}>{value}</Text>
      <Text style={vitalStyles.unit}>{unit}</Text>
      <Text style={vitalStyles.label}>{label}</Text>
    </View>
  );
}

const vitalStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  unit: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    severe: { bg: Colors.dangerLight, text: Colors.danger },
    moderate: { bg: Colors.warningLight, text: Colors.warning },
    mild: { bg: Colors.successLight, text: Colors.success },
  };
  const c = config[severity.toLowerCase()] ?? { bg: Colors.surfaceAlt, text: Colors.textSecondary };
  return (
    <View style={[styles.severityBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.severityText, { color: c.text }]}>{severity}</Text>
    </View>
  );
}

export default function HealthRecordScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 100;

  const queryClient = useQueryClient();
  const { data: record, isLoading: loadingRecord } = useGetHealthRecord();
  const { data: visits, isLoading: loadingVisits } = useGetVisits();

  const visitMutation = useAddVisit();
  const [showVisitModal, setShowVisitModal] = useState(false);

  const [vClinic, setVClinic] = useState("");
  const [vDept, setVDept] = useState("");
  const [vDate, setVDate] = useState("");
  const [vDiag, setVDiag] = useState("");
  const [vCost, setVCost] = useState("0");

  const handleAddVisit = () => {
    if (!vClinic || !vDate || !vDept) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    visitMutation.mutate(
      {
        data: {
          clinicName: vClinic,
          department: vDept,
          date: vDate,
          diagnosis: vDiag,
          cost: Number(vCost) || 0,
        },
      },
      {
        onSuccess: () => {
          setShowVisitModal(false);
          setVClinic(""); setVDept(""); setVDate(""); setVDiag(""); setVCost("0");
          queryClient.invalidateQueries({ queryKey: ["/api/health-record/visits"] });
        },
      }
    );
  };

  const profile = (record as HealthRecord | null) ?? {
    fullName: "Your Profile",
    nationality: "--",
    bloodType: "--",
    height: 0,
    weight: 0,
    bmi: 0,
    nhisNumber: "--",
    allergies: [],
    vitals: {},
  };

  if (loadingRecord) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#002D72", "#0048B4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.profileHero, { paddingTop: topPadding + 16 }]}
        >
          <View style={styles.profileAvatarWrap}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {profile.fullName?.charAt(0) ?? "?"}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{profile.fullName}</Text>
          <View style={styles.profileTagsRow}>
            {profile.nationality && (
              <View style={styles.profileTag}>
                <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.profileTagText}>{profile.nationality}</Text>
              </View>
            )}
            {profile.bloodType && (
              <View style={[styles.profileTag, { backgroundColor: "rgba(239,68,68,0.3)" }]}>
                <MaterialCommunityIcons name="water" size={12} color="#FCA5A5" />
                <Text style={styles.profileTagText}>Type {profile.bloodType}</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            {[
              { label: "Height", value: profile.height ? `${profile.height} cm` : "--" },
              { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "--" },
              { label: "BMI", value: profile.bmi ? `${profile.bmi}` : "--" },
              { label: "NHIS", value: profile.nhisNumber ? "Active" : "N/A" },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Current Vitals</Text>
          <View style={styles.vitalsGrid}>
            <VitalCard
              icon="heart"
              lib="Ionicons"
              label="Heart Rate"
              value={profile.vitals?.heartRate ? `${profile.vitals.heartRate}` : "--"}
              unit="bpm"
              color={Colors.danger}
              bg={Colors.dangerLight}
            />
            <VitalCard
              icon="thermometer"
              lib="MaterialCommunityIcons"
              label="Temperature"
              value={profile.vitals?.temperature ? `${profile.vitals.temperature}` : "--"}
              unit="°C"
              color={Colors.warning}
              bg={Colors.warningLight}
            />
            <VitalCard
              icon="water"
              lib="MaterialCommunityIcons"
              label="Blood Pressure"
              value={profile.vitals?.bloodPressure ?? "--"}
              unit="mmHg"
              color={Colors.accent}
              bg={Colors.accentLight}
            />
            <VitalCard
              icon="pulse"
              lib="Ionicons"
              label="SpO2"
              value={profile.vitals?.oxygenSaturation ? `${profile.vitals.oxygenSaturation}` : "--"}
              unit="%"
              color={Colors.primary}
              bg={Colors.primaryLight}
            />
          </View>

          {profile.allergies && profile.allergies.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Allergies</Text>
              <View style={styles.allergyList}>
                {profile.allergies.map((a) => (
                  <View key={a.id} style={styles.allergyItem}>
                    <View style={styles.allergyLeft}>
                      <Ionicons name="warning" size={16} color={Colors.danger} />
                      <Text style={styles.allergyName}>{a.allergen}</Text>
                    </View>
                    <SeverityBadge severity={a.severity} />
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.medHistHeader}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <Pressable
              style={({ pressed }) => [styles.addVisitBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowVisitModal(true)}
            >
              <Feather name="plus" size={14} color={Colors.primary} />
              <Text style={styles.addVisitText}>Add Visit</Text>
            </Pressable>
          </View>

          {loadingVisits ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (visits as Visit[] | undefined)?.length ? (
            <View style={styles.visitsList}>
              {(visits as Visit[]).map((v, i) => (
                <View key={v.id} style={styles.visitItem}>
                  <View style={styles.visitTimeline}>
                    <View style={styles.visitDot} />
                    {i < (visits as Visit[]).length - 1 && <View style={styles.visitLine} />}
                  </View>
                  <View style={styles.visitCard}>
                    <View style={styles.visitHeader}>
                      <Text style={styles.visitClinic}>{v.clinicName}</Text>
                      {v.cost !== undefined && v.cost > 0 && (
                        <Text style={styles.visitCost}>{formatKRW(v.cost)}</Text>
                      )}
                    </View>
                    <View style={styles.visitMeta}>
                      {v.department && (
                        <View style={styles.visitDeptBadge}>
                          <Text style={styles.visitDeptText}>{v.department}</Text>
                        </View>
                      )}
                      <Text style={styles.visitDate}>{formatDate(v.date)}</Text>
                    </View>
                    {v.diagnosis && (
                      <View style={styles.diagBox}>
                        <Text style={styles.diagLabel}>Diagnosis: </Text>
                        <Text style={styles.diagText}>{v.diagnosis}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyVisits}>
              <Ionicons name="document-text-outline" size={36} color={Colors.border} />
              <Text style={styles.emptyVisitsTitle}>No visits recorded</Text>
              <Text style={styles.emptyVisitsText}>Add your hospital visits to track your medical history.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showVisitModal} animationType="slide" transparent onRequestClose={() => setShowVisitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record a Visit</Text>
              <Pressable onPress={() => setShowVisitModal(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Clinic / Hospital Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={vClinic}
                onChangeText={setVClinic}
                placeholder="E.g., Seoul National University Hospital"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Date *</Text>
              <TextInput
                style={styles.modalInput}
                value={vDate}
                onChangeText={setVDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.modalInput}
                value={vDept}
                onChangeText={setVDept}
                placeholder="E.g., Internal Medicine"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Diagnosis</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
                value={vDiag}
                onChangeText={setVDiag}
                placeholder="What was the diagnosis or reason for visit?"
                placeholderTextColor={Colors.textMuted}
                multiline
              />

              <Text style={styles.inputLabel}>Total Cost (KRW)</Text>
              <TextInput
                style={styles.modalInput}
                value={vCost}
                onChangeText={setVCost}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  (!vClinic || !vDate || visitMutation.isPending) && styles.saveBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleAddVisit}
                disabled={!vClinic || !vDate || visitMutation.isPending}
              >
                {visitMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Visit Record</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
    gap: 10,
  },
  profileAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: "#fff",
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
  },
  profileTagsRow: {
    flexDirection: "row",
    gap: 8,
  },
  profileTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  profileTagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    marginTop: 6,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
    marginTop: 4,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  allergyList: {
    gap: 8,
  },
  allergyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  allergyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  allergyName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  medHistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addVisitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addVisitText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.primary,
  },
  visitsList: {
    gap: 0,
  },
  visitItem: {
    flexDirection: "row",
    gap: 12,
  },
  visitTimeline: {
    width: 20,
    alignItems: "center",
    paddingTop: 18,
  },
  visitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  visitLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  visitCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
    gap: 6,
  },
  visitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  visitClinic: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  visitCost: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  visitMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visitDeptBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  visitDeptText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.textSecondary,
  },
  visitDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  diagBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    padding: 8,
  },
  diagLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  diagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  emptyVisits: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyVisitsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  emptyVisitsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
