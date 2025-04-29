import React, { useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, serverTimestamp } from 'firebase/database';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { auth, database } from '@/config/firebase';

const { width, height } = Dimensions.get("window");

const OutfitGenieLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/explore');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully");
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setErrorMessage("All fields are required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await set(ref(database, `users/${user.uid}`), {
        fullName: name,
        email: email,
        createdAt: serverTimestamp()
      });
      
      console.log("User account created & signed in!");
    } catch (error: any) {
      console.error("Signup error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Password Reset",
        "Password reset email sent. Check your inbox."
      );
    } catch (error: any) {
      console.error("Password reset error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage("");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

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
                      <TouchableOpacity onPress={handleForgotPassword}>
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
    </GestureHandlerRootView>
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
    fontSize: 20,
    fontWeight: "500",
    color: "#146E5F",
    letterSpacing: 0.3,
    marginTop: 15,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 99, 71, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 99, 71, 0.5)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
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
    backgroundColor: "#20B2AA",
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