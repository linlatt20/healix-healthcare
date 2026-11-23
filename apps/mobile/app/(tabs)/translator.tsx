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
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTranslateMedical } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

const LANGUAGES = ["English", "Korean", "Spanish", "Chinese", "Vietnamese"];

type MedicalTerm = { original: string; translation: string; explanation?: string };
type TranslationResult = {
  translatedText: string;
  sourceLanguage: string;
  medicalTerms?: MedicalTerm[];
};

function TermCard({ term }: { term: MedicalTerm }) {
  return (
    <View style={styles.termCard}>
      <View style={styles.termHeader}>
        <Text style={styles.termOriginal}>{term.original}</Text>
        <Feather name="arrow-right" size={14} color={Colors.textMuted} style={{ marginHorizontal: 8 }} />
        <View style={styles.termTransBadge}>
          <Text style={styles.termTransText}>{term.translation}</Text>
        </View>
      </View>
      {term.explanation && (
        <Text style={styles.termExplanation}>{term.explanation}</Text>
      )}
    </View>
  );
}

export default function TranslatorScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 100;

  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Korean");
  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const translateMutation = useTranslateMedical();

  const toggleRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setText((prev) => prev + (prev ? " " : "") + "Voice input placeholder — connect microphone API for real-time transcription");
      }, 3000);
    }
  };

  const handleTranslate = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateMutation.mutate(
      { data: { text, sourceLanguage: sourceLang, targetLanguage: targetLang } },
      { onSuccess: (data) => setResult(data as TranslationResult) }
    );
  };

  const handleSwap = () => {
    const tmp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tmp);
    if (result) {
      setText(result.translatedText);
      setResult(null);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.headerTitle}>Voice Translator</Text>
        <Text style={styles.headerSub}>Real-time AI medical translation with voice</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.langRow}>
            <View style={styles.langPickerWrap}>
              <Text style={styles.langLabel}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.langPills}>
                  {LANGUAGES.map((l) => (
                    <Pressable
                      key={l}
                      style={[styles.langPill, sourceLang === l && styles.langPillActive]}
                      onPress={() => { setSourceLang(l); setResult(null); }}
                    >
                      <Text style={[styles.langPillText, sourceLang === l && styles.langPillTextActive]}>
                        {l}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Pressable
              style={({ pressed }) => [styles.swapBtn, pressed && { opacity: 0.7 }]}
              onPress={handleSwap}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={20} color={Colors.primary} />
            </Pressable>

            <View style={styles.langPickerWrap}>
              <Text style={styles.langLabel}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.langPills}>
                  {LANGUAGES.map((l) => (
                    <Pressable
                      key={l}
                      style={[styles.langPill, targetLang === l && styles.langPillActive]}
                      onPress={() => { setTargetLang(l); setResult(null); }}
                    >
                      <Text style={[styles.langPillText, targetLang === l && styles.langPillTextActive]}>
                        {l}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Enter medical text</Text>
          <TextInput
            style={styles.textArea}
            value={text}
            onChangeText={(t) => { setText(t); setResult(null); }}
            placeholder="Enter symptoms, diagnosis, or medical instructions..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.voiceBtn, isRecording && styles.voiceBtnRecording, pressed && { opacity: 0.85 }]}
              onPress={toggleRecording}
            >
              <MaterialCommunityIcons
                name={isRecording ? "stop" : "microphone"}
                size={22}
                color={isRecording ? "#fff" : Colors.primary}
              />
              <Text style={[styles.voiceBtnText, isRecording && { color: "#fff" }]}>
                {isRecording ? "Stop" : "Voice"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.translateBtn,
                (!text.trim() || translateMutation.isPending) && styles.translateBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleTranslate}
              disabled={!text.trim() || translateMutation.isPending}
            >
              {translateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="translate" size={18} color="#fff" />
                  <Text style={styles.translateBtnText}>Translate</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {(result || translateMutation.isPending) && (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={styles.cardLabel}>Translation</Text>
              <View style={styles.targetLangBadge}>
                <Text style={styles.targetLangText}>{targetLang}</Text>
              </View>
            </View>
            {translateMutation.isPending ? (
              <View style={styles.loadingResult}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.loadingResultText}>Translating with medical context...</Text>
              </View>
            ) : result ? (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{result.translatedText}</Text>
              </View>
            ) : null}
          </View>
        )}

        {result?.medicalTerms && result.medicalTerms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={16} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Medical Terms Explained</Text>
            </View>
            {result.medicalTerms.map((term, i) => (
              <TermCard key={i} term={term} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginBottom: 4,
  },
  headerSub: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  langPickerWrap: {
    flex: 1,
    gap: 6,
  },
  langLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langPills: {
    flexDirection: "row",
    gap: 6,
  },
  langPill: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langPillActive: {
    backgroundColor: Colors.accentLight,
  },
  langPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  langPillTextActive: {
    color: Colors.accent,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  cardLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceBtnRecording: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  voiceBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  translateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
  },
  translateBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  translateBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  targetLangBadge: {
    backgroundColor: Colors.accentLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  targetLangText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  loadingResult: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingResultText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  resultBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    padding: 14,
  },
  resultText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  termCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  termHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  termOriginal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  termTransBadge: {
    backgroundColor: Colors.accentLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  termTransText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.accent,
  },
  termExplanation: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
  },
});
