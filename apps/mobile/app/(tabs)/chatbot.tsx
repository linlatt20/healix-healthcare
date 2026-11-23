import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useChatbotMessage } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ConvMessage = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  content:
    "Hello! I'm Healix AI, your personal medical consultation assistant. Ask me about symptoms, medications, treatment options, or any healthcare questions about Korea. How can I help you today?",
};

function UrgencyBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    emergency: { label: "EMERGENCY", bg: Colors.danger, text: "#fff" },
    high: { label: "HIGH", bg: Colors.warning, text: "#fff" },
    medium: { label: "MEDIUM", bg: "#F59E0B", text: "#fff" },
    low: { label: "LOW", bg: Colors.success, text: "#fff" },
  };
  const config = map[level.toLowerCase()] ?? { label: level.toUpperCase(), bg: Colors.border, text: Colors.text };
  return (
    <View style={[styles.urgencyBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.urgencyText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
      <View style={styles.botAvatar}>
        <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.primary} />
      </View>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </View>
  );
}

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [urgency, setUrgency] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = useChatbotMessage();

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    const convHistory: ConvMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [userMsg, ...prev]);

    chatMutation.mutate(
      {
        data: {
          message: trimmed,
          conversationHistory: convHistory,
          language: "English",
        },
      },
      {
        onSuccess: (data) => {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.message,
          };
          setMessages((prev) => [botMsg, ...prev]);
          if (data.urgencyLevel) setUrgency(data.urgencyLevel);
          if (data.suggestedDepartments?.length) setDepartments(data.suggestedDepartments);
        },
      }
    );
  }, [input, chatMutation, messages]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const headerComponent = chatMutation.isPending ? <TypingIndicator /> : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <MaterialCommunityIcons name="robot-outline" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Healix AI</Text>
              <Text style={styles.headerSubtitle}>Medical Consultation</Text>
            </View>
          </View>
          {urgency && <UrgencyBadge level={urgency} />}
        </View>

        {departments.length > 0 && (
          <View style={styles.deptRow}>
            <ScrollViewHorizontal>
              {departments.map((d) => (
                <Pressable
                  key={d}
                  style={styles.deptChip}
                  onPress={() =>
                    router.push({ pathname: "/(tabs)/clinics" as const, params: { department: d } })
                  }
                >
                  <Feather name="map-pin" size={11} color={Colors.primary} />
                  <Text style={styles.deptChipText}>{d}</Text>
                </Pressable>
              ))}
            </ScrollViewHorizontal>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={headerComponent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!!messages.length}
      />

      <View style={[styles.inputBar, { paddingBottom: bottomPadding + 10 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about symptoms, medications, or medical advice..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() || chatMutation.isPending) && styles.sendBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleSend}
          disabled={!input.trim() || chatMutation.isPending}
        >
          {chatMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}> AI guidance only · Not a substitute for medical advice</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function ScrollViewHorizontal({ children }: { children: React.ReactNode }) {
  const { ScrollView } = require("react-native");
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  urgencyBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  urgencyText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  deptRow: {
    marginTop: 10,
    flexDirection: "row",
  },
  deptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  deptChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: "#fff",
  },
  bubbleTextBot: {
    color: Colors.text,
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dot1: {},
  dot2: {},
  dot3: {},
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
});
