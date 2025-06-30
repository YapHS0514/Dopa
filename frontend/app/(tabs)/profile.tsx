import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { apiClient } from '../../lib/api';
import { uploadImageToSupabase } from '../../lib/imageUpload';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const MOCK_USER = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  joinDate: 'March 2024',
};

const SETTINGS_OPTIONS = [
  { id: 'theme', icon: '🎨', title: 'Theme', value: 'Dark' },
  { id: 'notifications', icon: '🔔', title: 'Notifications', value: 'On' },
  { id: 'language', icon: '🌍', title: 'Language', value: 'English' },
  { id: 'feedback', icon: '💭', title: 'Send Feedback', value: '' },
  { id: 'about', icon: 'ℹ️', title: 'About Dopa', value: 'v1.0.0' },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile, refetch } = useUserProfile();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editUsernameModalVisible, setEditUsernameModalVisible] =
    useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  const handleSignOut = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/(auth)/login');
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
  };

  const handleEditUsernamePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewUsername(profile?.full_name || '');
    setEditUsernameModalVisible(true);
  };

  const closeEditUsernameModal = () => {
    setEditUsernameModalVisible(false);
    setNewUsername('');
  };

  const handleUpdateUsername = async () => {
    try {
      if (!newUsername.trim()) {
        Alert.alert('Error', 'Username cannot be empty');
        return;
      }

      if (newUsername.trim() === profile?.full_name) {
        Alert.alert('Info', 'No changes to save');
        return;
      }

      setUpdatingUsername(true);

      await apiClient.updateUsername(newUsername.trim());

      setUpdatingUsername(false);
      setEditUsernameModalVisible(false);

      // Refresh profile data to show new username
      await refetch();

      Alert.alert('Success', 'Username updated successfully!');
    } catch (error: any) {
      console.error('Error updating username:', error);
      setUpdatingUsername(false);

      // Handle specific error messages from the API
      if (error.message?.includes('already taken')) {
        Alert.alert(
          'Username Taken',
          'This username is already taken. Please choose a different one.'
        );
      } else if (error.message?.includes('at least 2 characters')) {
        Alert.alert(
          'Invalid Username',
          'Username must be at least 2 characters long.'
        );
      } else if (error.message?.includes('less than 50 characters')) {
        Alert.alert(
          'Invalid Username',
          'Username must be less than 50 characters.'
        );
      } else {
        Alert.alert('Error', 'Failed to update username. Please try again.');
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access camera roll is required!'
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access camera is required!'
        );
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      if (!profile?.id) {
        Alert.alert('Error', 'User profile not found');
        return;
      }

      setUploadingImage(true);

      // Upload image to Supabase Storage
      const uploadResult = await uploadImageToSupabase(imageUri, profile.id);

      if (!uploadResult.success || !uploadResult.url) {
        Alert.alert('Error', uploadResult.error || 'Failed to upload image');
        setUploadingImage(false);
        return;
      }

      // Update avatar URL in database
      await apiClient.updateUserAvatar(uploadResult.url);

      setUploadingImage(false);
      setProfileModalVisible(false);

      // Refresh profile data to show new avatar
      await refetch();

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const renderSettingItem = (item: (typeof SETTINGS_OPTIONS)[0]) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { backgroundColor: Colors.cardBackground }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Handle setting item press
      }}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <Text style={[styles.settingTitle, { color: Colors.text }]}>
          {item.title}
        </Text>
      </View>
      {item.value && (
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: Colors.textSecondary }]}>
            {item.value}
          </Text>
          <Feather
            name="chevron-right"
            size={20}
            color={Colors.textSecondary}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
          >
            <LinearGradient
              colors={[Colors.tint, Colors.tint]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                      profile?.full_name || 'User'
                    }`,
                }}
                style={styles.avatar}
              />
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: Colors.text }]}>
              {profile?.full_name || 'User'}
            </Text>
            <TouchableOpacity
              style={styles.editUsernameButton}
              onPress={handleEditUsernamePress}
            >
              <Feather name="edit-2" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.email, { color: Colors.textSecondary }]}>
            {profile?.email || ''}
          </Text>
          <Text style={[styles.joinDate, { color: Colors.textSecondary }]}>
            🔥 {profile?.streak_days || 0}-day streak
          </Text>
        </View>

        {/* Coin Info Row */}
        <TouchableOpacity
          style={styles.coinRow}
          onPress={() => router.push('/CoinsMarketplaceScreen')}
        >
          <Text style={styles.coinText}>
            🪙 {(profile?.total_coins || 0).toLocaleString()} Coins
          </Text>
          <Text style={styles.viewLink}>View Marketplace →</Text>
        </TouchableOpacity>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>
            Settings
          </Text>
          <View style={styles.settingsList}>
            {SETTINGS_OPTIONS.map(renderSettingItem)}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.signOutButton,
            {
              backgroundColor: Colors.cardBackground,
            },
          ]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={20} color={Colors.tint} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Picture Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeProfileModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeProfileModal}
            >
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Large Profile Picture */}
            <View style={styles.largeAvatarContainer}>
              <LinearGradient
                colors={[Colors.tint, Colors.tint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.largeAvatarGradient}
              >
                <Image
                  source={{
                    uri:
                      profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                        profile?.full_name || 'User'
                      }`,
                  }}
                  style={styles.largeAvatar}
                />
              </LinearGradient>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: Colors.cardBackground,
                    opacity: uploadingImage ? 0.5 : 1,
                  },
                ]}
                onPress={pickImageFromGallery}
                disabled={uploadingImage}
              >
                <Feather name="image" size={20} color={Colors.tint} />
                <Text style={[styles.actionButtonText, { color: Colors.text }]}>
                  {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: Colors.cardBackground,
                    opacity: uploadingImage ? 0.5 : 1,
                  },
                ]}
                onPress={takePhoto}
                disabled={uploadingImage}
              >
                <Feather name="camera" size={20} color={Colors.tint} />
                <Text style={[styles.actionButtonText, { color: Colors.text }]}>
                  {uploadingImage ? 'Uploading...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Username Modal */}
      <Modal
        visible={editUsernameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEditUsernameModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeEditUsernameModal}
            >
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Modal Title */}
            <Text style={[styles.modalTitle, { color: Colors.text }]}>
              Edit Username
            </Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.usernameInput,
                  {
                    color: Colors.text,
                    backgroundColor: Colors.cardBackground,
                    borderColor: Colors.textSecondary,
                  },
                ]}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Enter username"
                placeholderTextColor={Colors.textSecondary}
                maxLength={50}
                autoFocus={true}
                editable={!updatingUsername}
              />
              <Text
                style={[styles.characterCount, { color: Colors.textSecondary }]}
              >
                {newUsername.length}/50
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  {
                    backgroundColor: Colors.cardBackground,
                    opacity: updatingUsername ? 0.5 : 1,
                  },
                ]}
                onPress={closeEditUsernameModal}
                disabled={updatingUsername}
              >
                <Text style={[styles.modalButtonText, { color: Colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  {
                    backgroundColor: Colors.tint,
                    opacity: updatingUsername ? 0.5 : 1,
                  },
                ]}
                onPress={handleUpdateUsername}
                disabled={updatingUsername}
              >
                <Text style={[styles.modalButtonText, { color: '#000' }]}>
                  {updatingUsername ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    padding: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontFamily: 'SF-Pro-Display',
  },
  editUsernameButton: {
    marginLeft: 8,
    padding: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    opacity: 0.8,
  },
  coinRow: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 16,
    color: '#F5F5F5',
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  viewLink: {
    fontSize: 14,
    color: '#FACC15',
    fontFamily: 'SF-Pro-Display',
    fontWeight: '500',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 16,
  },
  settingsList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 16,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    color: Colors.tint,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: screenWidth * 0.85,
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  largeAvatarContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginVertical: 20,
    overflow: 'hidden',
  },
  largeAvatarGradient: {
    flex: 1,
    padding: 4,
  },
  largeAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
  },
  actionButtons: {
    width: '100%',
    gap: 15,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  // Edit Username Modal styles
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  usernameInput: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'right',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    // Additional styles can be added here if needed
  },
  saveButton: {
    // Additional styles can be added here if needed
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
});
