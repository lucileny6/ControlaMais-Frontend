import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  children: string;
  onPress?: () => void;
}

export function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  children,
  onPress,
}: ButtonProps) {
  const baseStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 8,
  };

  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return { backgroundColor: "#000" };
      case "secondary":
        return { backgroundColor: "#6b7280" };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "#3b82f6",
        };
      default:
        return { backgroundColor: "#3b82f6" };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "medium":
        return { paddingHorizontal: 16, paddingVertical: 12 };
      case "large":
        return { paddingHorizontal: 24, paddingVertical: 16 };
      default:
        return { paddingHorizontal: 16, paddingVertical: 12 };
    }
  };

  const getTextColor = () => {
    return variant === "outline" ? "#3b82f6" : "#ffffff";
  };

  const getLoadingColor = () => {
    return variant === "outline" ? "#3b82f6" : "#ffffff";
  };

  const getTextSize = () => {
    return size === "large" ? 16 : 14;
  };

  return (
    <TouchableOpacity
      style={[
        baseStyle,
        getVariantStyle(),
        getSizeStyle(),
        (disabled || loading) && { opacity: 0.5 },
      ]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLoadingColor()} />
      ) : (
        <Text
          style={{
            color: getTextColor(),
            fontSize: getTextSize(),
            fontWeight: "600",
          }}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
