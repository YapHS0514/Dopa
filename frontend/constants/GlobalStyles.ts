import { StyleSheet } from 'react-native';

export const GlobalStyles = StyleSheet.create({
  // Global text styles with SF Pro Display font
  text: {
    fontFamily: 'SF-Pro-Display',
    color: '#F2F2F2',
  },
  textBold: {
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    color: '#F2F2F2',
  },
  textMedium: {
    fontFamily: 'SF-Pro-Display',
    fontWeight: '500',
    color: '#F2F2F2',
  },
  textLight: {
    fontFamily: 'SF-Pro-Display',
    fontWeight: '300',
    color: '#F2F2F2',
  },
  
  // Global container styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Global card styles
  card: {
    backgroundColor: '#222222',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Global button styles
  button: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    fontFamily: 'SF-Pro-Display',
    fontSize: 16,
    fontWeight: '600',
    color: '#F2F2F2',
  },

  logoText: {
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    fontSize: 64,
    color: '#F2F2F2',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },
}); 