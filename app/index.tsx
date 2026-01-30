import { useRouter } from "expo-router";
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Controla+</Text>

        <View style={styles.topActions}>
          {/*<TouchableOpacity onPress={() => router.push("/sobre")}>
            <Text style={styles.sobre}>Sobre</Text>
          </TouchableOpacity>*/}

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.register}>Cadastrar-se</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.login}>Conectar-se</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER */}
      <ImageBackground
        source={require("../assets/images/banner.jpeg")} // você troca depois
        style={styles.banner}
        resizeMode="cover"
      ></ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  /* TOP BAR */
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3b82f6",
  },

  topActions: {
    flexDirection: "row",
    gap: 20,
  },

  sobre: {
    fontSize: 16,
    color: "#000000",
  },

  register: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
  },

  login: {
    fontSize: 16,
    color: "#000000",
  },

  banner: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
});
