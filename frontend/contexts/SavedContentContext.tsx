import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './AuthContext';

interface SavedItem {
  id: string; // The saved_id from the backend
  contentId: string; // The actual content ID
}

interface SavedContentContextType {
  savedContentIds: Set<string>;
  savedItems: Map<string, SavedItem>; // Map contentId -> SavedItem
  isContentSaved: (contentId: string) => boolean;
  addSavedContent: (contentId: string, savedId: string) => void;
  removeSavedContent: (contentId: string) => void;
  getSavedItemId: (contentId: string) => string | null;
  refreshSavedContent: () => Promise<void>;
  isLoading: boolean;
}

const SavedContentContext = createContext<SavedContentContextType | undefined>(undefined);

export const SavedContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // Get auth state
  const [savedContentIds, setSavedContentIds] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Map<string, SavedItem>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const lastRefreshTime = useRef(0);
  const refreshCooldown = 5000; // 5 seconds cooldown between refreshes
  const pendingOperations = useRef<Set<string>>(new Set()); // Track pending operations

  const refreshSavedContent = async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < refreshCooldown) {
      console.log('Skipping refresh - too soon since last refresh');
      return;
    }

    // Don't fetch if user is not authenticated
    if (!user) {
      console.log('User not authenticated, skipping saved content refresh');
      return;
    }

    try {
      setIsLoading(true);
      lastRefreshTime.current = now;
      console.log('Refreshing saved content cache...');
      const response = (await apiClient.getSavedContent()) as { data: any[] };
      
      console.log('Raw saved content response:', JSON.stringify(response.data, null, 2));
      
      const contentIds = new Set<string>();
      const itemsMap = new Map<string, SavedItem>();
      
      response.data.forEach((savedItem: any, index: number) => {
        console.log(`Processing saved item ${index}:`, savedItem);
        
        // Handle the actual API response structure
        let contentId: string | null = null;
        let savedId: string | null = null;
        
        // Get the saved_id (the ID of the saved record)
        savedId = savedItem.id;
        
        if (savedItem.content?.id) {
          // New structure: { id: saved_id, content: { id: content_id, ... } }
          contentId = savedItem.content.id;
          console.log(`Found content ID via savedItem.content.id: ${contentId}`);
        } else if (savedItem.content_id) {
          // Legacy structure: { content_id: content_id }
          contentId = savedItem.content_id;
          console.log(`Found content ID via savedItem.content_id: ${contentId}`);
        } else if (savedItem.contents?.id) {
          // Alternative structure: { contents: { id: content_id } }
          contentId = savedItem.contents.id;
          console.log(`Found content ID via savedItem.contents.id: ${contentId}`);
        }
        
        if (contentId && savedId) {
          contentIds.add(contentId);
          itemsMap.set(contentId, { id: savedId, contentId });
          console.log(`Added content ID ${contentId} with saved ID ${savedId} to cache`);
        } else {
          console.log('No content ID or saved ID found for saved item:', savedItem);
        }
      });
      
      console.log(`Cached ${contentIds.size} saved content items:`, Array.from(contentIds));
      setSavedContentIds(contentIds);
      setSavedItems(itemsMap);
    } catch (error) {
      console.error('Error fetching saved content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isContentSaved = (contentId: string): boolean => {
    return savedContentIds.has(contentId);
  };

  const addSavedContent = (contentId: string, savedId: string) => {
    setSavedContentIds(prev => new Set([...prev, contentId]));
    setSavedItems(prev => new Map(prev).set(contentId, { id: savedId, contentId }));
  };

  const removeSavedContent = (contentId: string) => {
    setSavedContentIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(contentId);
      return newSet;
    });
    setSavedItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(contentId);
      return newMap;
    });
  };

  const getSavedItemId = (contentId: string): string | null => {
    return savedItems.get(contentId)?.id || null;
  };

  // Load saved content only when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      console.log('User authenticated, loading saved content...');
      refreshSavedContent();
    } else if (!user && !authLoading) {
      // Clear saved content when user signs out
      console.log('User not authenticated, clearing saved content...');
      setSavedContentIds(new Set());
      setSavedItems(new Map());
    }
  }, [user, authLoading]);

  const value: SavedContentContextType = {
    savedContentIds,
    savedItems,
    isContentSaved,
    addSavedContent,
    removeSavedContent,
    getSavedItemId,
    refreshSavedContent,
    isLoading,
  };

  return (
    <SavedContentContext.Provider value={value}>
      {children}
    </SavedContentContext.Provider>
  );
};

export const useSavedContent = (): SavedContentContextType => {
  const context = useContext(SavedContentContext);
  if (!context) {
    throw new Error('useSavedContent must be used within a SavedContentProvider');
  }
  return context;
}; 