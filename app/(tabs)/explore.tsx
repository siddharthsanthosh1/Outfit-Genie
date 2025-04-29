import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType } from 'expo-camera';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const OUTFIT_SIZE = (width - 60) / 2;
const CALENDAR_DAY_SIZE = (width - 80) / 7;
const SWIPE_THRESHOLD = 120;

const ExplorePage = () => {
  const [userName, setUserName] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const cameraRef = useRef<Camera>(null);
  const auth = getAuth();
  const database = getDatabase();
  
  // Sample style cards for swiping - all with the same mint green color
  const styleCards = [
    { id: 1, color: '#88D8B0', name: 'Casual' },
    { id: 2, color: '#88D8B0', name: 'Formal' },
    { id: 3, color: '#88D8B0', name: 'Sporty' },
    { id: 4, color: '#88D8B0', name: 'Evening' },
    { id: 5, color: '#88D8B0', name: 'Vintage' },
  ];
  
  // Animation values for the swipe card
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    // Get current user's name from Firebase
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          // First try to get name from database
          const userRef = ref(database, `users/${auth.currentUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserName(userData.fullName || (auth.currentUser?.email?.split('@')[0] || 'User'));
          } else {
            // Fallback to display name or email
            setUserName(auth.currentUser.displayName || (auth.currentUser?.email?.split('@')[0] || 'User'));
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          // Fallback if database fetch fails
          setUserName(auth.currentUser.displayName || (auth.currentUser?.email?.split('@')[0] || 'User'));
        }
      }
    };
    
    fetchUserData();
    
    // Request camera permissions
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (err) {
        console.error("Error requesting camera permissions:", err);
        setHasPermission(false);
        Alert.alert(
          "Camera Permission Error", 
          "Could not request camera permissions. Make sure expo-camera is installed properly."
        );
      }
    })();
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigate to login screen
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Logout Error', error.message);
    }
  };
  
  const handleCameraToggle = async () => {
    // Check if camera permissions are granted before showing camera
    if (!hasPermission && !showCamera) {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            "Camera Permission Required", 
            "Please grant camera permissions to use this feature."
          );
          return;
        }
      } catch (err) {
        console.error("Error requesting camera permissions:", err);
        Alert.alert(
          "Camera Error", 
          "Could not access camera. Make sure expo-camera is installed properly."
        );
        return;
      }
    }
    
    setShowCamera(!showCamera);
  };
  
  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera is not ready. Please try again.');
      return;
    }
    
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setShowCamera(false);
      // Here you would handle the photo, upload it, etc.
      Alert.alert('Photo Captured', 'Your clothing item has been captured!');
    } catch (error: any) {
      console.error("Error taking picture:", error);
      Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
    }
  };
  
  // Handle card swipe
  const handleSwipeComplete = (direction: 'left' | 'right') => {
    // Process the swipe (like or dislike)
    console.log(`Swiped ${direction} on card ${styleCards[currentCardIndex].name}`);
    
    // Move to next card
    if (currentCardIndex < styleCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Reset to first card when we reach the end
      setCurrentCardIndex(0);
    }
    
    // Reset animation values with a slight delay to allow animation to complete
    setTimeout(() => {
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
    }, 300);
  };
  
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
      rotation.value = (translateX.value / 10);
    },
    onEnd: (event) => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        // Swipe completed
        const direction = translateX.value > 0 ? 'right' : 'left';
        translateX.value = withSpring(direction === 'right' ? width : -width, { damping: 15 });
        translateY.value = withSpring(0);
        runOnJS(handleSwipeComplete)(direction);
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    },
  });
  
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });
  
  // Get current day name
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  // Generate next 7 days for calendar strip
  const calendarDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    calendarDays.push({
      day: days[date.getDay()],
      date: date.getDate(),
      hasOutfit: Math.random() > 0.5, // Randomly assign outfits for demo
      isToday: i === 0,
    });
  }

  // Camera view
  if (showCamera) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {hasPermission === true ? (
            <View style={styles.camera}>
              <Camera 
                style={StyleSheet.absoluteFill}
                ref={cameraRef}
                type={CameraType.back}
                ratio="16:9"
              />
              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.captureButton}
                  onPress={handleTakePicture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.cameraPermissionContainer}>
              <Text style={styles.cameraPermissionText}>
                {hasPermission === false 
                  ? "No access to camera. Please enable camera permissions." 
                  : "Requesting camera permission..."}
              </Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.buttonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Mint to Teal gradient background */}
        <LinearGradient
          colors={['#DCFFF9', '#88D8C0']}
          style={styles.backgroundGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.8 }}
        />

        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header with logout button */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.username}>{userName}</Text>
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
                <Ionicons name="log-out-outline" size={20} color="#146E5F" />
              </TouchableOpacity>
            </View>

            {/* Upload Photos Button */}
            <TouchableOpacity 
              style={styles.createOutfitButton}
              onPress={handleCameraToggle}
            >
              <LinearGradient
                colors={['#20B2AA', '#146E5F']}
                style={styles.createOutfitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.createOutfitContent}>
                  <Ionicons name="camera" size={28} color="white" />
                  <Text style={styles.createOutfitText}>Upload Photos of Your Clothes</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>


  


            {/* Discover Section with Swipe Cards */}
            <View style={styles.discoverContainer}>
              <Text style={styles.sectionTitle}>Discover New Styles</Text>
              <View style={styles.swipeContainer}>
                {styleCards.map((card, index) => {
                  // Only render the current card and the next one
                  if (index < currentCardIndex || index > currentCardIndex + 1) return null;
                  
                  // Current card is swipeable
                  if (index === currentCardIndex) {
                    return (
                      <PanGestureHandler key={card.id} onGestureEvent={gestureHandler}>
                        <Animated.View style={[styles.swipeCard, cardStyle, { backgroundColor: card.color }]}>
                          <Text style={styles.swipeCardText}>{card.name} Style</Text>
                          <View style={styles.swipeInstructions}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                            <Text style={styles.swipeInstructionsText}>Swipe</Text>
                            <Ionicons name="arrow-forward" size={24} color="white" />
                          </View>
                        </Animated.View>
                      </PanGestureHandler>
                    );
                  }
                  
                  // Next card is shown underneath
                  return (
                    <View 
                      key={card.id} 
                      style={[styles.swipeCard, styles.nextCard, { backgroundColor: card.color }]}
                    >
                      <Text style={styles.swipeCardText}>{card.name} Style</Text>
                      <View style={styles.swipeInstructions}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                        <Text style={styles.swipeInstructionsText}>Swipe</Text>
                        <Ionicons name="arrow-forward" size={24} color="white" />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Quick Actions Bar */}
          <View style={styles.quickActionsBar}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="home" size={24} color="#146E5F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="calendar" size={24} color="#88D8C0" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.cameraButton]}
              onPress={handleCameraToggle}
            >
              <Ionicons name="camera" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="heart" size={24} color="#88D8C0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="person" size={24} color="#88D8C0" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCFFF9',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#146E5F',
    fontWeight: '400',
  },
  username: {
    fontSize: 24,
    color: '#146E5F',
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 14,
    color: '#146E5F',
    fontWeight: '500',
    marginRight: 5,
  },
  createOutfitButton: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  createOutfitGradient: {
    width: '100%',
    height: 70,
  },
  createOutfitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOutfitText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 10,
    fontWeight: '600',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  calendarGradient: {
    borderRadius: 16,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  calendarDay: {
    width: CALENDAR_DAY_SIZE,
    height: CALENDAR_DAY_SIZE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  calendarDayToday: {
    backgroundColor: '#146E5F',
    shadowColor: '#146E5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarDayText: {
    fontSize: 12,
    color: '#146E5F',
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: 'white',
  },
  calendarDateText: {
    fontSize: 16,
    color: '#146E5F',
    fontWeight: '600',
  },
  calendarDateTextToday: {
    color: 'white',
  },
  outfitIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20B2AA',
    marginTop: 4,
  },
  outfitIndicatorToday: {
    backgroundColor: 'white',
  },
  recentOutfitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#146E5F',
    marginBottom: 10,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    color: '#20B2AA',
    fontWeight: '500',
  },
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  outfitItem: {
    width: OUTFIT_SIZE,
    height: OUTFIT_SIZE * 1.4,
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  outfitLabelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
  },
  outfitLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  discoverContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  swipeContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  swipeCard: {
    width: CARD_WIDTH,
    height: 250,
    borderRadius: 16,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10, // Ensure the card is above other elements
  },
  nextCard: {
    transform: [{ scale: 0.9 }],
    top: 10,
    zIndex: 5, // Lower z-index for the card underneath
  },
  swipeCardText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  swipeInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
  },
  swipeInstructionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  quickActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#20B2AA',
    width: 50,
    height: 50,
    borderRadius: 25,
    transform: [{ translateY: -15 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  // Camera styles
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPermissionText: {
    fontSize: 16,
    color: '#146E5F',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#20B2AA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExplorePage;