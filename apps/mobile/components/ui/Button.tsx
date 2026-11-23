import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/constants/colors";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantConfig: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, text: "#fff" },
  secondary: { bg: Colors.surface, text: Colors.primary, border: Colors.primary },
  ghost: { bg: "transparent", text: Colors.primary },
};

const sizeConfig: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingVertical: 7, paddingHorizontal: 14, fontSize: 12, borderRadius: 10 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 14, borderRadius: 12 },
  lg: { paddingVertical: 15, paddingHorizontal: 24, fontSize: 15, borderRadius: 14 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const vConf = variantConfig[variant];
  const sConf = sizeConfig[size];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: vConf.bg,
          paddingVertical: sConf.paddingVertical,
          paddingHorizontal: sConf.paddingHorizontal,
          borderRadius: sConf.borderRadius,
          borderWidth: vConf.border ? 1.5 : 0,
          borderColor: vConf.border ?? "transparent",
          opacity: pressed || disabled ? 0.75 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vConf.text} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: vConf.text, fontSize: sConf.fontSize },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
  },
});
