import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const GlobalStyles = StyleSheet.create({
  // Text styles
  text: {
    color: Colors.text,
    fontFamily: 'Inter',
  },
  textSecondary: {
    fontFamily: 'SFProDisplay',
    color: Colors.textSecondary,
  },
  
  // Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  
  // Card styles
  card: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Navigation styles
  rightNavBar: {
    backgroundColor: Colors.primary,
    width: '60%', // Reduced width as per requirements
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  
  // Save notification styles
  saveNotification: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -25 }],
    backgroundColor: Colors.notificationBackground,
    padding: 15,
    borderRadius: 12,
    width: 150,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Streak & coins bar styles
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  
  // Streak and coins containers
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.streakBackground,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.coinsBackground,
  },

  heading: {
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 16,
  },
  subheading: {
    color: Colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
}); 