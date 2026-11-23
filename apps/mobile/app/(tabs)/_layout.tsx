import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chatbot">
        <Icon sf={{ default: "message.circle", selected: "message.circle.fill" }} />
        <Label>AI Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clinics">
        <Icon sf={{ default: "cross.case", selected: "cross.case.fill" }} />
        <Label>Clinics</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="translator">
        <Icon sf={{ default: "globe", selected: "globe" }} />
        <Label>Translate</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Community</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health-record">
        <Icon sf={{ default: "heart.text.square", selected: "heart.text.square.fill" }} />
        <Label>Health</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.surface,
          borderTopWidth: isWeb ? 1 : 0.5,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="message.circle" tintColor={color} size={24} /> : <MaterialCommunityIcons name="chat-processing-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clinics"
        options={{
          title: "Clinics",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="cross.case" tintColor={color} size={24} /> : <FontAwesome5 name="hospital" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="translator"
        options={{
          title: "Translate",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="globe" tintColor={color} size={24} /> : <MaterialCommunityIcons name="translate" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.2" tintColor={color} size={24} /> : <MaterialCommunityIcons name="account-group-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health-record"
        options={{
          title: "Health",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="heart.text.square" tintColor={color} size={24} /> : <MaterialCommunityIcons name="heart-pulse" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insurance"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
