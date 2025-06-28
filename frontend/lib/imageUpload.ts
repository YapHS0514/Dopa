import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImageToSupabase = async (
  imageUri: string,
  userId: string,
  bucketName: string = 'avatars'
): Promise<UploadResult> => {
  try {
    console.log('Starting image upload for user:', userId);
    console.log('Image URI:', imageUri);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return { success: false, error: 'User not authenticated' };
    }
    console.log('User authenticated:', user.id);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    console.log('Generated filename:', fileName);

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to array buffer
    const arrayBuffer = decode(base64);
    console.log('File size (bytes):', arrayBuffer.byteLength);

    // Upload to Supabase Storage
    console.log('Uploading to bucket:', bucketName);
    
    // Try alternative upload approach
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: false, // Don't overwrite - create new file each time
      });

    if (error) {
      console.error('Upload error details:', error);
      return { success: false, error: error.message };
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    console.log('Public URL generated:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
};

export const deleteImageFromSupabase = async (
  fileName: string,
  bucketName: string = 'avatars'
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}; 