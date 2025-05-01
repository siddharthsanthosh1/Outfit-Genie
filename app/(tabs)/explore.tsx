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
  TextInput,
  FlatList,
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
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [likedBrands, setLikedBrands] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'brands', or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const cameraRef = useRef<Camera>(null);
  const auth = getAuth();
  const database = getDatabase();
  
  const styleCards = [
    { id: 1, color: '#88D8B0', name: 'Casual' },
    { id: 2, color: '#88D8B0', name: 'Formal' },
    { id: 3, color: '#88D8B0', name: 'Sporty' },
    { id: 4, color: '#88D8B0', name: 'Evening' },
    { id: 5, color: '#88D8B0', name: 'Vintage' },
  ];
  const brandCards = [
    { id: 1, name: 'Nike', description: 'Athletic wear and footwear' },
    { id: 2, name: 'Zara', description: 'Fast fashion clothing and accessories' },
    { id: 3, name: 'H&M', description: 'Affordable fashion for everyone' },
    { id: 4, name: 'Adidas', description: 'Sports and casual wear' },
    { id: 5, name: 'Under Armour', description: 'Sports wear and footwear' },
  ];
  
  const clothingItems = [
    { id: 1, name: 'White T-Shirt', category: 'Tops', brand: 'Nike' },
    { id: 2, name: 'Black Jeans', category: 'Bottoms', brand: 'Zara' },
    { id: 3, name: 'Blue Hoodie', category: 'Tops', brand: 'H&M' },
    { id: 4, name: 'Running Shoes', category: 'Footwear', brand: 'Adidas' },
    { id: 5, name: 'Denim Jacket', category: 'Outerwear', brand: 'Uniqlo' },
    { id: 6, name: 'Floral Dress', category: 'Dresses', brand: 'Zara' },
    { id: 7, name: 'Khaki Pants', category: 'Bottoms', brand: 'H&M' },
    { id: 8, name: 'Leather Boots', category: 'Footwear', brand: 'Nike' },
  ];
  
  const styleTranslateX = useSharedValue(0);
  const styleTranslateY = useSharedValue(0);
  const styleRotation = useSharedValue(0);
  
  const brandTranslateX = useSharedValue(0);
  const brandTranslateY = useSharedValue(0);
  const brandRotation = useSharedValue(0);
  
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
            setUserName(auth.currentUser.displayName || (auth.currentUser?.email?.split('@')[0] || 'User'));
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          setUserName(auth.currentUser.displayName || (auth.currentUser?.email?.split('@')[0] || 'User'));
        }
      }
    };
    
    fetchUserData();
    
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
  
  // Handle style card swipe
  const handleStyleSwipeComplete = (direction: 'left' | 'right') => {
    // Process the swipe (like or dislike)
    console.log(`Swiped ${direction} on style ${styleCards[currentStyleIndex].name}`);
    
    if (currentStyleIndex < styleCards.length - 1) {
      setCurrentStyleIndex(currentStyleIndex + 1);
    } else {
      // Reset to first card when we reach the end
      setCurrentStyleIndex(0);
    }
    
    setTimeout(() => {
      styleTranslateX.value = 0;
      styleTranslateY.value = 0;
      styleRotation.value = 0;
    }, 300);
  };
  
  // Handle brand card swipe
  const handleBrandSwipeComplete = (direction: 'right' | 'left') => {
    // Process the swipe (like or dislike)
    console.log(`Swiped ${direction} on brand ${brandCards[currentBrandIndex].name}`);
    
    if (direction === 'right') {
      const brandName = brandCards[currentBrandIndex].name;
      if (!likedBrands.includes(brandName)) {
        setLikedBrands([...likedBrands, brandName]);
      }
    }
    
    // Move to next card
    if (currentBrandIndex < brandCards.length - 1) {
      setCurrentBrandIndex(currentBrandIndex + 1);
    } else {
      // Reset to first card when we reach the end
      setCurrentBrandIndex(0);
    }
    
    // Reset animation values with a slight delay to allow animation to complete
    setTimeout(() => {
      brandTranslateX.value = 0;
      brandTranslateY.value = 0;
      brandRotation.value = 0;
    }, 300);
  };
  
  // Style card gesture handler
  const styleGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = styleTranslateX.value;
      ctx.startY = styleTranslateY.value;
    },
    onActive: (event, ctx: any) => {
      styleTranslateX.value = ctx.startX + event.translationX;
      styleTranslateY.value = ctx.startY + event.translationY;
      styleRotation.value = (styleTranslateX.value / 10);
    },
    onEnd: (event) => {
      if (Math.abs(styleTranslateX.value) > SWIPE_THRESHOLD) {
        // Swipe completed
        const direction = styleTranslateX.value > 0 ? 'right' : 'left';
        styleTranslateX.value = withSpring(direction === 'right' ? width : -width, { damping: 15 });
        styleTranslateY.value = withSpring(0);
        runOnJS(handleStyleSwipeComplete)(direction);
      } else {
        // Return to center
        styleTranslateX.value = withSpring(0);
        styleTranslateY.value = withSpring(0);
        styleRotation.value = withSpring(0);
      }
    },
  });
  
  // Brand card gesture handler
  const brandGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = brandTranslateX.value;
      ctx.startY = brandTranslateY.value;
    },
    onActive: (event, ctx: any) => {
      brandTranslateX.value = ctx.startX + event.translationX;
      brandTranslateY.value = ctx.startY + event.translationY;
      brandRotation.value = (brandTranslateX.value / 10);
    },
    onEnd: (event) => {
      if (Math.abs(brandTranslateX.value) > SWIPE_THRESHOLD) {
        // Swipe completed
        const direction = brandTranslateX.value > 0 ? 'right' : 'left';
        brandTranslateX.value = withSpring(direction === 'right' ? width : -width, { damping: 15 });
        brandTranslateY.value = withSpring(0);
        runOnJS(handleBrandSwipeComplete)(direction);
      } else {
        // Return to center
        brandTranslateX.value = withSpring(0);
        brandTranslateY.value = withSpring(0);
        brandRotation.value = withSpring(0);
      }
    },
  });
  
  const styleCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: styleTranslateX.value },
        { translateY: styleTranslateY.value },
        { rotate: `${styleRotation.value}deg` },
      ],
    };
  });
  
  const brandCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: brandTranslateX.value },
        { translateY: brandTranslateY.value },
        { rotate: `${brandRotation.value}deg` },
      ],
    };
  });
  
  // Filter clothing items based on search query
  const filteredClothingItems = clothingItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <View style={styles.discoverContainer}>
            <Text style={styles.sectionTitle}>Discover New Styles</Text>
            <View style={styles.swipeContainer}>
              {styleCards.map((card, index) => {
                // Only render the current card and the next one
                if (index < currentStyleIndex || index > currentStyleIndex + 1) return null;
                
                // Current card is swipeable
                if (index === currentStyleIndex) {
                  return (
                    <PanGestureHandler key={card.id} onGestureEvent={styleGestureHandler}>
                      <Animated.View style={[styles.swipeCard, styleCardStyle, { backgroundColor: card.color }]}>
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
        );
      
      case 'brands':
        return (
          <View style={styles.brandsContainer}>
            <Text style={styles.sectionTitle}>Clothing Brands You Like</Text>
            <View style={styles.swipeContainer}>
              {brandCards.map((card, index) => {
                // Only render the current card and the next one
                if (index < currentBrandIndex || index > currentBrandIndex + 1) return null;
                
                // Current card is swipeable
                if (index === currentBrandIndex) {
                  return (
                    <PanGestureHandler key={card.id} onGestureEvent={brandGestureHandler}>
                      <Animated.View style={[styles.swipeCard, brandCardStyle, styles.brandCard]}>
                        <Text style={styles.brandCardTitle}>{card.name}</Text>
                        <Text style={styles.brandCardDescription}>{card.description}</Text>
                        <View style={styles.swipeInstructions}>
                          <Ionicons name="arrow-back" size={24} color="#146E5F" />
                          <Text style={[styles.swipeInstructionsText, { color: '#146E5F' }]}>Swipe</Text>
                          <Ionicons name="arrow-forward" size={24} color="#146E5F" />
                        </View>
                      </Animated.View>
                    </PanGestureHandler>
                  );
                }
                
                // Next card is shown underneath
                return (
                  <View 
                    key={card.id} 
                    style={[styles.swipeCard, styles.nextCard, styles.brandCard]}
                  >
                    <Text style={styles.brandCardTitle}>{card.name}</Text>
                    <Text style={styles.brandCardDescription}>{card.description}</Text>
                  </View>
                );
              })}
            </View>
            
            {/* Liked brands list */}
            {likedBrands.length > 0 && (
              <View style={styles.likedBrandsContainer}>
                <Text style={styles.likedBrandsTitle}>Your Liked Brands</Text>
                <View style={styles.likedBrandsList}>
                  {likedBrands.map((brand, index) => (
                    <View key={index} style={styles.likedBrandTag}>
                      <Text style={styles.likedBrandText}>{brand}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      
      case 'search':
        return (
          <View style={styles.searchContainer}>
            <Text style={styles.sectionTitle}>Search Clothing Items</Text>
            
            {/* Search results */}
            {searchQuery ? (
              filteredClothingItems.length > 0 ? (
                <FlatList
                  data={filteredClothingItems}
                  numColumns={2}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.clothingItem}>
                      <View style={styles.clothingImageContainer}>
                        {/* Placeholder for actual image */}
                        <View style={styles.clothingImagePlaceholder} />
                        <TouchableOpacity style={styles.likeButton}>
                          <Ionicons name="heart-outline" size={20} color="#146E5F" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.clothingItemName}>{item.name}</Text>
                      <View style={styles.clothingItemDetails}>
                        <Text style={styles.clothingItemBrand}>{item.brand}</Text>
                        <View style={styles.clothingItemCategory}>
                          <Text style={styles.clothingItemCategoryText}>{item.category}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.clothingGrid}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No items found matching "{searchQuery}"</Text>
                </View>
              )
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>Type in the search box to find clothing items</Text>
              </View>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  // Tab buttons for switching between sections
  const renderTabButtons = () => (
    <View style={styles.tabButtonsContainer}>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'discover' && styles.activeTabButton]}
        onPress={() => setActiveTab('discover')}
      >
        <Text style={[styles.tabButtonText, activeTab === 'discover' && styles.activeTabButtonText]}>
          Discover
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'brands' && styles.activeTabButton]}
        onPress={() => setActiveTab('brands')}
      >
        <Text style={[styles.tabButtonText, activeTab === 'brands' && styles.activeTabButtonText]}>
          Brands
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
        onPress={() => setActiveTab('search')}
      >
        <Text style={[styles.tabButtonText, activeTab === 'search' && styles.activeTabButtonText]}>
          Search
        </Text>
      </TouchableOpacity>
    </View>
  );

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

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#88D8C0" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for clothing items..."
                placeholderTextColor="#88D8C0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setActiveTab('search')}
              />
            </View>

            {/* Tab Buttons */}
            {renderTabButtons()}

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

            {/* Tab Content */}
            {renderTabContent()}
          </ScrollView>

          {/* Quick Actions Bar */}
          <View style={styles.quickActionsBar}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="home" size={24} color="#146E5F" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('search')}
            >
              <Ionicons name="search" size={24} color={activeTab === 'search' ? "#146E5F" : "#88D8C0"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.cameraButton]}
              onPress={handleCameraToggle}
            >
              <Ionicons name="camera" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('brands')}
            >
              <Ionicons name="heart" size={24} color={activeTab === 'brands' ? "#146E5F" : "#88D8C0"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('discover')}
            >
              <Ionicons name="compass" size={24} color={activeTab === 'discover' ? "#146E5F" : "#88D8C0"} />
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: '#146E5F',
    fontSize: 16,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 15,
  },
  activeTabButton: {
    backgroundColor: '#146E5F',
  },
  tabButtonText: {
    color: '#146E5F',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: 'white',
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
  discoverContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  brandsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#146E5F',
    marginBottom: 10,
    fontWeight: '600',
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
  brandCard: {
    backgroundColor: 'white',
    padding: 20,
  },
  brandCardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#146E5F',
    textAlign: 'center',
    marginBottom: 10,
  },
  brandCardDescription: {
    fontSize: 16,
    color: '#146E5F',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  likedBrandsContainer: {
    marginTop: 20,
  },
  likedBrandsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#146E5F',
    marginBottom: 10,
  },
  likedBrandsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  likedBrandTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  likedBrandText: {
    color: '#146E5F',
    fontWeight: '500',
  },
  clothingGrid: {
    paddingTop: 10,
  },
  clothingItem: {
    width: (width - 50) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clothingImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  clothingImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  likeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clothingItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#146E5F',
    marginBottom: 4,
  },
  clothingItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clothingItemBrand: {
    fontSize: 12,
    color: '#888',
  },
  clothingItemCategory: {
    backgroundColor: 'rgba(136, 216, 176, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  clothingItemCategoryText: {
    fontSize: 10,
    color: '#146E5F',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noResultsText: {
    color: '#146E5F',
    fontSize: 16,
    textAlign: 'center',
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
