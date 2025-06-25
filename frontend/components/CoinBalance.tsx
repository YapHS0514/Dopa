import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface CoinBalanceProps {
  balance: number;
  style?: any;
  showLabel?: boolean;
}

export default function CoinBalance({ balance, style, showLabel = true }: CoinBalanceProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>🪙</Text>
      <Text style={styles.balance}>
        {balance.toLocaleString()}{showLabel ? ' coins' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  balance: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'SF-Pro-Display',
  },
}); 