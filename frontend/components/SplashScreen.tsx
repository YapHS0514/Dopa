import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const LETTER_DELAY = 300; // ms between each letter
const WORD_COMPLETE_DELAY = 1200; // Wait for all letters to appear
const MOVE_TO_TOP_DELAY = 500; // Delay before moving to top

// Register custom animations
Animatable.initializeRegistryWithDefinitions({
  letterAppear: {
    0: {
      opacity: 0,
      transform: [{ translateY: 20 }],
    },
    0.7: {
      opacity: 1,
      transform: [{ translateY: -5 }],
    },
    0.9: {
      transform: [{ translateY: 2 }],
    },
    1: {
      transform: [{ translateY: 0 }],
    },
  },
  bounceAndShrink: {
    0: {
      transform: [{ scale: 1 }],
    },
    0.6: {
      transform: [{ scale: 0.8 }],
    },
    0.8: {
      transform: [{ scale: 1.1 }],
    },
    1: {
      transform: [{ scale: 1.0 }],
    },
  },
  moveToTop: {
    0: {
      transform: [{ translateY: 0 }],
    },
    1: {
      transform: [{ translateY: -SCREEN_HEIGHT * 0.3 }],
    },
  },
});

const LETTERS = ['D', 'O', 'P', 'A'];

export default function SplashScreen() {
  const [animatingLetters, setAnimatingLetters] = useState<number[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [hasBouncedAndShrunk, setHasBouncedAndShrunk] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    // Start letter animation sequence
    let currentIndex = 0;
    const animateNextLetter = () => {
      if (currentIndex < LETTERS.length) {
        setAnimatingLetters(prev => [...prev, currentIndex]);
        currentIndex++;
        setTimeout(animateNextLetter, LETTER_DELAY);
      } else {
        // Word is complete
        setTimeout(() => {
          setIsWordComplete(true);
          
          // Schedule bounce and shrink
          setTimeout(() => {
            setHasBouncedAndShrunk(true);
            
            // Schedule move to top
            setTimeout(() => {
              setHasMoved(true);
              
              // Finally show buttons
              setTimeout(() => {
                setShowButtons(true);
              }, MOVE_TO_TOP_DELAY);
            }, MOVE_TO_TOP_DELAY);
          }, MOVE_TO_TOP_DELAY);
        }, WORD_COMPLETE_DELAY);
      }
    };

    // Start the animation sequence after a short delay
    setTimeout(animateNextLetter, 500);
  }, []);

  const handleNavigate = async (route: 'login' | 'register') => {
    router.replace(`/(auth)/${route}`);
  };

  const renderLetters = () => {
    return LETTERS.map((letter, index) => (
      <Animatable.Text
        key={letter}
        style={[
          styles.letter,
          !animatingLetters.includes(index) && styles.hiddenLetter
        ]}
        animation={animatingLetters.includes(index) ? 'letterAppear' : undefined}
        duration={800}
        useNativeDriver
      >
        {letter}
      </Animatable.Text>
    ));
  };

  return (
    <View style={styles.container}>
      <Animatable.View
        style={[
          styles.wordContainer,
          hasMoved && styles.wordContainerTop
        ]}
        animation={
          hasMoved 
            ? 'moveToTop'
            : hasBouncedAndShrunk 
              ? 'bounceAndShrink' 
              : undefined
        }
        duration={500}
        useNativeDriver
      >
        {renderLetters()}
      </Animatable.View>

      {showButtons && (
        <Animatable.View 
          style={styles.buttonContainer}
          animation="fadeInUp"
          duration={800}
          delay={200}
          useNativeDriver
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleNavigate('login')}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => handleNavigate('register')}
          >
            <Text style={[styles.buttonText, styles.registerButtonText]}>Sign Up</Text>
          </TouchableOpacity>
        </Animatable.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '40%',
  },
  wordContainerTop: {
    top: '10%',
  },
  letter: {
    fontSize: 64,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 2,
  },
  hiddenLetter: {
    opacity: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    width: '80%',
    gap: 16,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  registerButton: {
    backgroundColor: '#F5F5F5',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
    fontWeight: '600',
    color: '#F5F5F5',
  },
  registerButtonText: {
    color: '#000000',
  },
}); 