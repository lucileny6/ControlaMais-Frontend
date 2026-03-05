import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type User = {
  name?: string;
  nome?: string;
  nomeCompleto?: string;
  displayName?: string;
  userName?: string;
  user_name?: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  given_name?: string;
  email?: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;

    const decodeBase64 = (globalThis as any)?.atob;
    if (typeof decodeBase64 !== "function") return null;
    const json = decodeBase64(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getStringClaim(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function resolveUserName(user: User | null) {
  if (!user) return "";

  const emailPrefix = user.email?.includes("@") ? user.email.split("@")[0].trim().toLowerCase() : "";
  const candidates = [
    user.name,
    user.nome,
    user.nomeCompleto,
    user.displayName,
    user.fullName,
    user.firstName,
    user.given_name,
    user.userName,
    user.user_name,
    user.username,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (emailPrefix && value.toLowerCase() === emailPrefix) continue;
    return value;
  }

  return "";
}

function resolveAvatarInitial(displayName: string) {
  const nameSource = String(displayName ?? "").trim();
  const fromName = nameSource.match(/[A-Za-zÀ-ÿ]/);
  if (fromName?.[0]) return fromName[0].toUpperCase();
  return "U";
}

function getUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const email = getStringClaim(payload, ["email", "upn"]);
  const sub = getStringClaim(payload, ["sub"]);
  const name = getStringClaim(payload, [
    "name",
    "nome",
    "nomeCompleto",
    "displayName",
    "fullName",
    "firstName",
    "given_name",
    "preferred_username",
    "user_name",
    "username",
  ]);

  const resolvedEmail = email || (sub.includes("@") ? sub : "");
  const resolvedName = name;

  if (!resolvedName && !resolvedEmail) return null;
  return { name: resolvedName || undefined, email: resolvedEmail || undefined };
}

function mergeUsers(primary: User | null, fallback: User | null): User | null {
  if (!primary && !fallback) return null;
  return {
    ...fallback,
    ...primary,
  };
}

export function DashboardHeader() {
  const router = useRouter();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const [storedUser, legacyStoredUser, storedDisplayName, legacyDisplayName, authToken, legacyAuthToken] =
          await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("@user"),
          AsyncStorage.getItem("displayName"),
          AsyncStorage.getItem("@displayName"),
          AsyncStorage.getItem("authToken"),
          AsyncStorage.getItem("@authToken"),
          ]);

        const rawUser = storedUser || legacyStoredUser;
        const displayName = (storedDisplayName || legacyDisplayName || "").trim();
        const token = authToken || legacyAuthToken;

        const userFromStorage = rawUser ? (JSON.parse(rawUser) as User) : null;
        const localDisplayNameUser = displayName ? ({ displayName } as User) : null;
        const enhancedUserFromStorage = mergeUsers(userFromStorage, localDisplayNameUser);
        const userFromToken = token ? getUserFromToken(token) : null;

        setUser(mergeUsers(enhancedUserFromStorage, userFromToken));
      } catch {
        setUser(null);
      }
    };

    void loadUser();
  }, []);

  const displayName = useMemo(() => {
    const rawName = resolveUserName(user);
    return rawName || "Usuario";
  }, [user]);

  const displayEmail = user?.email?.trim() ? user.email.trim() : "Email nao informado";
  const avatarInitial = resolveAvatarInitial(displayName);

  const handleAvatarPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setDropdownPosition({ x: pageX - 200, y: pageY + 10 });
    setDropdownVisible(true);
  };

  const menuItems = [
    { label: "Configuracoes", onPress: () => console.log("Configuracoes") },
    { label: "Ajuda", onPress: () => console.log("Ajuda") },
    {
      label: "Sair",
      onPress: async () => {
        await AsyncStorage.multiRemove([
          "authToken",
          "user",
          "displayName",
          "@authToken",
          "@user",
          "@displayName",
        ]);
        router.replace("/login");
      },
    },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Controla</Text>
          <Text style={styles.logoPlus}>+</Text>
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarButton} onPress={handleAvatarPress}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitial || "U"}</Text>
            </View>
          </TouchableOpacity>

          <Modal
            visible={dropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
              <View style={styles.modalOverlay}>
                <View
                  style={[
                    styles.dropdownContent,
                    {
                      position: "absolute",
                      top: dropdownPosition.y,
                      right: 16,
                    },
                  ]}
                >
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>{displayName}</Text>
                    <Text style={styles.menuSubtitle}>{displayEmail}</Text>
                  </View>

                  <View style={styles.menuSeparator} />

                  {menuItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          item.onPress();
                          setDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.menuItemText}>{item.label}</Text>
                      </TouchableOpacity>
                      {index < menuItems.length - 1 && <View style={styles.menuSeparator} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "#ffffff",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  logoText: {
    fontSize: 34,
    fontWeight: "700",
    color: "#000000",
  },
  logoPlus: {
    fontSize: 34,
    fontWeight: "700",
    color: "#13b8a0",
  },
  avatarContainer: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  dropdownContent: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    elevation: 5,
    paddingVertical: 8,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#666666",
  },
  menuSeparator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: "#000000",
  },
});
