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
import { Feather, MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useGetClinics, useRecommendClinic } from "@workspace/api-client-react";
import type { Clinic } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

const DEPARTMENTS = [
  "Internal Medicine", "Dermatology", "Dentistry",
  "Ophthalmology", "Orthopedics", "ENT",
];
const DISTRICTS = ["Gangnam", "Itaewon", "Mapo", "Jongno"];
const LANGUAGES = ["English", "Chinese", "Japanese"];

function ClinicCard({ clinic }: { clinic: Clinic }) {
  return (
    <View style={styles.clinicCard}>
      <View style={styles.clinicHeader}>
        <View style={styles.clinicNameWrap}>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          {clinic.nameKorean && (
            <Text style={styles.clinicNameKorean}>{clinic.nameKorean}</Text>
          )}
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.ratingText}>{clinic.rating ?? "4.5"}</Text>
        </View>
      </View>

      <View style={styles.clinicInfoRow}>
        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.clinicInfoText} numberOfLines={2}>{clinic.address}</Text>
      </View>

      <View style={styles.clinicInfoRow}>
        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.clinicInfoText}>{clinic.openHours ?? "09:00 - 18:00 (Mon-Fri)"}</Text>
      </View>

      <View style={styles.deptWrap}>
        {clinic.departments.slice(0, 3).map((d) => (
          <View key={d} style={styles.deptBadge}>
            <Text style={styles.deptBadgeText}>{d}</Text>
          </View>
        ))}
        {clinic.departments.length > 3 && (
          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText}>+{clinic.departments.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.clinicFooter}>
        <View style={styles.tagsRow}>
          {clinic.hasNhis && (
            <View style={[styles.footerTag, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="shield-checkmark" size={11} color={Colors.success} />
              <Text style={[styles.footerTagText, { color: Colors.success }]}>NHIS</Text>
            </View>
          )}
          {clinic.languages?.includes("English") && (
            <View style={[styles.footerTag, { backgroundColor: Colors.accentLight }]}>
              <Text style={[styles.footerTagText, { color: Colors.accent }]}>ENG</Text>
            </View>
          )}
        </View>
        {clinic.phone && (
          <Pressable
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.75 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Feather name="phone" size={14} color={Colors.primary} />
            <Text style={styles.callBtnText}>Call</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ClinicsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 100;

  const params = useLocalSearchParams<{ department?: string }>();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(params.department ?? "");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("");
  const [nhisOnly, setNhisOnly] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: allClinics, isLoading } = useGetClinics({
    query: search || undefined,
    department: department || undefined,
    district: district || undefined,
    language: language || undefined,
  });

  const clinics = nhisOnly ? allClinics?.filter((c) => c.hasNhis) : allClinics;

  const recommendMutation = useRecommendClinic();

  const handleSymptomSearch = () => {
    if (!symptoms.trim()) return;
    recommendMutation.mutate(
      { data: { symptoms, language: "English" } },
      {
        onSuccess: (data) => {
          if (data.recommendedDepartments?.[0]) {
            setDepartment(data.recommendedDepartments[0].department);
          }
          setShowSymptomModal(false);
          setSymptoms("");
        },
      }
    );
  };

  const activeFilters = [department, district, language].filter(Boolean).length + (nhisOnly ? 1 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Clinic Finder</Text>
            <Text style={styles.headerSub}>English-speaking doctors in Seoul</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.aiBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setShowSymptomModal(true)}
          >
            <MaterialCommunityIcons name="magic-staff" size={16} color={Colors.primary} />
            <Text style={styles.aiBtnText}>AI Match</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search clinics..."
              placeholderTextColor={Colors.textMuted}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Feather name="sliders" size={18} color={activeFilters > 0 ? Colors.primary : Colors.textMuted} />
            {activeFilters > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollRow}>
            <View style={styles.chipGroup}>
              <Text style={styles.chipGroupLabel}>Dept:</Text>
              {DEPARTMENTS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.chip, department === d && styles.chipActive]}
                  onPress={() => setDepartment(department === d ? "" : d)}
                >
                  <Text style={[styles.chipText, department === d && styles.chipTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollRow}>
            <View style={styles.chipGroup}>
              <Text style={styles.chipGroupLabel}>Area:</Text>
              {DISTRICTS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.chip, district === d && styles.chipActive]}
                  onPress={() => setDistrict(district === d ? "" : d)}
                >
                  <Text style={[styles.chipText, district === d && styles.chipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollRow}>
            <View style={styles.chipGroup}>
              <Text style={styles.chipGroupLabel}>Lang:</Text>
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l}
                  style={[styles.chip, language === l && styles.chipActive]}
                  onPress={() => setLanguage(language === l ? "" : l)}
                >
                  <Text style={[styles.chipText, language === l && styles.chipTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        {showFilters && (
          <View style={[styles.chipScrollRow, { marginBottom: 4 }]}>
            <View style={styles.chipGroup}>
              <Text style={styles.chipGroupLabel}>Coverage:</Text>
              <Pressable
                style={[styles.chip, nhisOnly && styles.chipActive]}
                onPress={() => setNhisOnly(!nhisOnly)}
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={13}
                  color={nhisOnly ? Colors.surface : Colors.textMuted}
                />
                <Text style={[styles.chipText, nhisOnly && styles.chipTextActive]}>NHIS Only</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Finding clinics...</Text>
          </View>
        ) : clinics?.length ? (
          clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="hospital" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No clinics found</Text>
            <Text style={styles.emptyText}>Try adjusting your search filters.</Text>
            {activeFilters > 0 && (
              <Pressable
                style={styles.clearBtn}
                onPress={() => { setSearch(""); setDepartment(""); setDistrict(""); setLanguage(""); setNhisOnly(false); }}
              >
                <Text style={styles.clearBtnText}>Clear Filters</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSymptomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSymptomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Symptom Matcher</Text>
              <Pressable onPress={() => setShowSymptomModal(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>
            <Text style={styles.modalDesc}>
              Describe your symptoms and Healix AI will recommend the right department and filter clinics for you.
            </Text>
            <TextInput
              style={styles.symptomInput}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="E.g., sharp pain in lower right abdomen since last night..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                (!symptoms.trim() || recommendMutation.isPending) && styles.modalBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleSymptomSearch}
              disabled={!symptoms.trim() || recommendMutation.isPending}
            >
              {recommendMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalBtnText}>Find Matching Clinics</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
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
    marginTop: 2,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  aiBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  chipScrollRow: {
    marginTop: 10,
  },
  chipGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipGroupLabel: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  chip: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.text,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  chipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  clinicCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  clinicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  clinicNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  clinicName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  clinicNameKorean: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#B45309",
  },
  clinicInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 4,
  },
  clinicInfoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  deptWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  deptBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deptBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  clinicFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  footerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  footerTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  callBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.primary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  clearBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  clearBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
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
  modalDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  symptomInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    height: 110,
    textAlignVertical: "top",
  },
  modalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  modalBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
