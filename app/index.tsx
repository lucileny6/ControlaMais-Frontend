import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_DOWNLOAD_URL = "https://SEU_LINK_DE_DOWNLOAD_AQUI";
const HERO_IMAGE = require("../assets/images/sem fundo.png");

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const handleDownloadApp = async () => {
    try {
      const canOpen = await Linking.canOpenURL(APP_DOWNLOAD_URL);
      if (!canOpen) {
        Alert.alert("Download", "Link de download ainda nao configurado.");
        return;
      }
      await Linking.openURL(APP_DOWNLOAD_URL);
    } catch {
      Alert.alert("Download", "Nao foi possivel abrir o link de download.");
    }
  };

  return (
    <LinearGradient
      colors={["#000000", "#073D33", "#107A65", "#20F4CA"]}
      locations={[0, 0.3, 0.57, 0.82, 1]}
      style={styles.page}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.heroWrap, isMobile && styles.heroWrapMobile]}>
          
          {/* LADO ESQUERDO */}
          <View style={[styles.left, isMobile && styles.leftMobile]}>
            <Text style={styles.title}>Controla+</Text>

            <Text style={styles.subtitle}>
              Organize, acompanhe e evolua no Controla+. Você em controle total
              das suas finanças.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.enterButton}
                onPress={() => router.push("/login")}
                activeOpacity={0.85}
              >
                <Text style={styles.enterButtonText}>
                  ACESSAR PELO NAVEGADOR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadApp}
                activeOpacity={0.85}
              >
                <Text style={styles.downloadButtonText}>
                  BAIXE PARA CELULAR
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LADO DIREITO */}
          <View style={[styles.right, isMobile && styles.rightMobile]}>
            <Image
              source={HERO_IMAGE}
              resizeMode="contain"
              style={styles.heroImage}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  heroWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },

  heroWrapMobile: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 32,
  },

  left: {
    flex: 1,
    maxWidth: 520,
  },

  leftMobile: {
    maxWidth: "100%",
    width: "100%",
  },

  title: {
    color: "#F7F8FA",
    fontSize: 72, // 🔥 maior
    fontWeight: "600",
    letterSpacing: -1.5,
    marginBottom: 12,
  },

  subtitle: {
    color: "#B7C1C1",
    fontSize: 16, // 🔥 maior
    lineHeight: 24,
    maxWidth: 420,
  },

  buttonRow: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },

  enterButton: {
    borderRadius: 999,
    borderWidth: 1.3,
    borderColor: "rgba(255, 255, 255, 0.45)",
    paddingVertical: 12,
    paddingHorizontal: 26,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },

  enterButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
  },

  downloadButton: {
    borderRadius: 999,
    borderWidth: 1.3,
    borderColor: "#36FF89",
    paddingVertical: 12,
    paddingHorizontal: 26,
    backgroundColor: "rgba(2, 12, 10, 0.55)",
  },

  downloadButtonText: {
    color: "#D5FFE7",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
  },

  right: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  rightMobile: {
    width: "100%",
  },

  heroImage: {
    width: 420, // 🔥 maior
    height: 420,
  },

  imageEnterButton: {
    position: "absolute",
    bottom: 28,
    backgroundColor: "#020305",
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#29E9CF",
  },

  imageEnterButtonText: {
    color: "#29E9CF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});