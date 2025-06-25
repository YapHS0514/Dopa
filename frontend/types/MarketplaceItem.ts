export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  isPurchased?: boolean;
  category?: 'streak' | 'content' | 'storage' | 'premium';
  isConsumable?: boolean; // Can be purchased multiple times
}

export interface CoinTransaction {
  id: string;
  itemId: string;
  cost: number;
  timestamp: Date;
  type: 'purchase' | 'refund';
}

// TODO: Connect these types to backend API responses
// Example: These should match the response from /api/marketplace/items 