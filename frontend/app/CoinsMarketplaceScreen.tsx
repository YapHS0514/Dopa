import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CoinBalance from '../components/CoinBalance';
import { MarketplaceItem } from '../types/MarketplaceItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'streak_restore',
    title: 'Regain Lost Streak 🔥',
    description: 'Restore your streak once if broken.',
    cost: 100,
  },
  {
    id: 'extra_fact_cards',
    title: 'Unlock 5 Extra Cards 🧠',
    description: 'Get 5 bonus cards today beyond the daily limit.',
    cost: 75,
  },
  {
    id: 'save_slot_upgrade',
    title: '5 More Save Slots 📥',
    description: 'Expand your saved card capacity.',
    cost: 150,
  },
  {
    id: '1_day_premium',
    title: '1 Day of Premium 💎',
    description: 'Enjoy all premium features for 24 hours.',
    cost: 300,
  },
];

export default function CoinsMarketplaceScreen() {
  const router = useRouter();
  
  // TODO: Connect to backend coin balance and inventory system
  const [coinBalance, setCoinBalance] = useState(1240); // Mock balance
  const [items, setItems] = useState<MarketplaceItem[]>(marketplaceItems);
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);
  const [floatingCoins, setFloatingCoins] = useState<Array<{id: string, anim: Animated.Value, x: number, y: number}>>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAnim] = useState(new Animated.Value(0));
  
  // Animation values for each item
  const itemAnimations = useRef<Record<string, {
    buttonScale: Animated.Value;
    cardScale: Animated.Value;
    checkmarkOpacity: Animated.Value;
  }>>({});
  
  // Initialize animations for each item
  useEffect(() => {
    marketplaceItems.forEach(item => {
      if (!itemAnimations.current[item.id]) {
        itemAnimations.current[item.id] = {
          buttonScale: new Animated.Value(1),
          cardScale: new Animated.Value(1),
          checkmarkOpacity: new Animated.Value(0),
        };
      }
    });
  }, []);
  
  // Handle success animations
  useEffect(() => {
    if (animatingItem && itemAnimations.current[animatingItem]) {
      const { cardScale, checkmarkOpacity } = itemAnimations.current[animatingItem];
      
      // Card pulse animation
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 1.02, duration: 150, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      
      // Checkmark animation
      Animated.sequence([
        Animated.timing(checkmarkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(checkmarkOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [animatingItem]);

  const animateFloatingCoins = (buttonX: number = 50, buttonY: number = 200) => {
    const newCoins = Array.from({ length: 3 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      anim: new Animated.Value(0),
      x: buttonX + (i - 1) * 15, // Spread coins around button position
      y: buttonY,
    }));
    
    setFloatingCoins(newCoins);
    
    // Animate coins floating up
    newCoins.forEach((coin, index) => {
      Animated.timing(coin.anim, {
        toValue: 1,
        duration: 1000,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
    
    // Remove coins after animation
    setTimeout(() => setFloatingCoins([]), 1200);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  const handlePurchase = (item: MarketplaceItem, buttonScale: Animated.Value) => {
    if (coinBalance >= item.cost) {
      // Button scale animation
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Start success animation
      setAnimatingItem(item.id);
      
      // Animate floating coins from button position
      // Calculate button position based on screen layout
      const itemIndex = items.findIndex(i => i.id === item.id);
      const buttonX = SCREEN_WIDTH - 80; // Right side where button is
      const buttonY = 260 + (itemIndex * 105); // Adjusted for new header layout (shifted down by ~40px)
      animateFloatingCoins(buttonX, buttonY);

      // Deduct coins
      const newBalance = coinBalance - item.cost;
      setCoinBalance(newBalance);
      
      // Only mark premium as purchased (one-time purchase)
      if (item.id === '1_day_premium') {
        setTimeout(() => {
          setItems(prev => 
            prev.map(i => 
              i.id === item.id ? { ...i, isPurchased: true } : i
            )
          );
        }, 800);
      }
      
      // Clear animation state
      setTimeout(() => setAnimatingItem(null), 1500);
      
      // TODO: Sync purchases to user account (Supabase)
      // Example: await api.purchaseItem(item.id, item.cost)
    } else {
      // Shake animation for insufficient funds
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      
      // Show toast message
      showToast('Not enough coins to purchase');
    }
  };

  const renderMarketplaceItem = ({ item }: { item: MarketplaceItem }) => {
    // Ensure animations exist for this item
    if (!itemAnimations.current[item.id]) {
      itemAnimations.current[item.id] = {
        buttonScale: new Animated.Value(1),
        cardScale: new Animated.Value(1),
        checkmarkOpacity: new Animated.Value(0),
      };
    }

    const { buttonScale, cardScale, checkmarkOpacity } = itemAnimations.current[item.id];

    return (
      <Animated.View style={[styles.itemCard, { transform: [{ scale: cardScale }] }]}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>
          
          <View style={styles.itemActions}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinCost}>{item.cost}</Text>
            </View>
            
            {item.isPurchased ? (
              <View style={styles.ownedButton}>
                <Text style={styles.ownedText}>Owned</Text>
              </View>
            ) : (
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={[
                    styles.purchaseButton, 
                    coinBalance < item.cost && styles.purchaseButtonDisabled
                  ]}
                  onPress={() => handlePurchase(item, buttonScale)}
                  disabled={coinBalance < item.cost}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.purchaseButtonText,
                    coinBalance < item.cost && styles.purchaseButtonTextDisabled
                  ]}>
                    Buy
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
        
        {/* Success Checkmark Overlay */}
        <Animated.View 
          style={[styles.successOverlay, { opacity: checkmarkOpacity }]}
          pointerEvents="none"
        >
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
            <Text style={styles.purchasedText}>Purchased!</Text>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Background Layers */}
      <View style={styles.backgroundLayer1} />
      <View style={styles.backgroundLayer2} />
      
      {/* Back Button Row */}
      <View style={styles.backButtonRow}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#F5F5F5" />
        </TouchableOpacity>
      </View>

      {/* Header Content */}
      <View style={styles.header}>
        <Text style={styles.title}>Coins Marketplace</Text>
        
        {/* Coin Balance Display */}
        <CoinBalance balance={coinBalance} />
      </View>

      {/* Marketplace Items List */}
      <FlatList
        data={items}
        renderItem={renderMarketplaceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Coins Animation */}
      {floatingCoins.map((coin, index) => (
        <Animated.Text
          key={coin.id}
          style={[
            styles.floatingCoin,
            {
              left: coin.x,
              top: coin.y,
              transform: [
                {
                  translateY: coin.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -150],
                  }),
                },
                {
                  translateX: coin.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -coin.x + 100], // Move towards balance area
                  }),
                },
                {
                  scale: coin.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.3, 0.8],
                  }),
                },
              ],
              opacity: coin.anim.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        >
          🪙
        </Animated.Text>
      ))}

      {/* Toast Notification */}
      {toastMessage && (
        <Animated.View 
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toast}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    // Professional gradient background effect using multiple layers
  },
  backgroundLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  backgroundLayer2: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    height: 150,
    backgroundColor: 'rgba(34, 197, 94, 0.02)',
    borderRadius: 30,
  },
  backButtonRow: {
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 8,
    alignItems: 'flex-start', // Align button to the left
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 16,
    marginTop: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 16,
  },

  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  itemCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20, // Increased spacing between cards
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    // Professional styling with subtle gradient effect
    borderLeftWidth: 2,
    borderLeftColor: '#22C55E',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5F5F5',
    fontFamily: 'SF-Pro-Display',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#B0B0B0',
    fontFamily: 'SF-Pro-Display',
    lineHeight: 16,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  coinIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  coinCost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'SF-Pro-Display',
  },
  purchaseButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#333',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display',
  },
  purchaseButtonTextDisabled: {
    color: '#888',
  },
  ownedButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  ownedText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SF-Pro-Display',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    alignItems: 'center',
    gap: 4,
  },
  purchasedText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
  },
  floatingCoin: {
    position: 'absolute',
    fontSize: 24,
    zIndex: 1000,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1001,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF-Pro-Display',
  },
}); 