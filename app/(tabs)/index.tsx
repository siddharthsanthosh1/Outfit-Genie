import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const OutfitGenieLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log(isLogin ? "Logging in..." : "Signing up...", { email, password, name });
    }, 1500);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Mint to Teal gradient background */}
      <LinearGradient
        colors={["#DCFFF9", "#88D8C0"]}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.8 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.keyboardAvoid}
        >
          <View style={styles.content}>
            <View style={styles.contentInner}>
              <View style={styles.header}>
                <Text style={styles.appName}>Outfit Genie</Text>
                {!isLoading && (
                  <Text style={styles.tagline}>
                    {isLogin ? "Welcome back" : "Create your account"}
                  </Text>
                )}
              </View>

              <View style={styles.formContainer}>
                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="rgba(20, 110, 95, 0.6)"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(20, 110, 95, 0.6)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(20, 110, 95, 0.6)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {isLogin && (
                  <View style={{ alignSelf: "flex-end", marginBottom: 24 }}>
                    <TouchableOpacity>
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View>
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleSubmit} 
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>
                        {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </Text>
                  <TouchableOpacity onPress={toggleAuthMode}>
                    <Text style={styles.switchActionText}>
                      {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DCFFF9",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentInner: {
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#146E5F",
    marginBottom: 10,
    padding: 10,
    letterSpacing: 0.5,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    color: "#146E5F",
    letterSpacing: 0.3,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 16,
    color: "#146E5F",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(136, 216, 192, 0.5)",
  },
  forgotPasswordText: {
    color: "#146E5F",
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
    backgroundColor: "#20B2AA", // Light Sea Green
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  switchText: {
    color: "#146E5F",
    fontSize: 14,
  },
  switchActionText: {
    color: "#20B2AA",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
});

export default OutfitGenieLogin;