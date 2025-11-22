import React from "react";
import { Modal, Text, TouchableWithoutFeedback, View } from "react-native";
import { Button } from "./button";

interface AlertDialogProps {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function AlertDialog({
  visible,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: AlertDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: 16,
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                padding: 24,
                width: "100%",
                maxWidth: 400,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {title}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 20,
                  marginBottom: 24,
                }}
              >
                {description}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <Button variant="outline" onPress={onCancel}>
                  {cancelText}
                </Button>
                <Button variant="primary" onPress={onConfirm}>
                  {confirmText}
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
