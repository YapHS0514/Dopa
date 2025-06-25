import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import * as Animatable from 'react-native-animatable';
import { TopicTags } from './TopicTags';

type ContentCardProps = {
  title: string;
  body: string;
  isSourceCard: boolean;
  isHookCard?: boolean; // <-- Add this
  sourceUrl?: string;
  onSourcePress?: () => void;
  tags?: string[]; // Added for topic tags display
};

export function ContentCard({
  title,
  body,
  isSourceCard,
  isHookCard,
  sourceUrl,
  onSourcePress,
  tags,
}: ContentCardProps) {
  return (
    <Animatable.View
      animation="fadeInUp"
      style={isSourceCard ? styles.sourceContainer : styles.container}
    >
      <View
        style={[
          styles.cardContentContainer,
          isHookCard && styles.hookCardContentContainer,
        ]}
      >
        {/* Show topic tags on front side only (not source cards) */}
        {!isSourceCard && tags && tags.length > 0 && (
          <TopicTags tags={tags} style={styles.topicTags} />
        )}
        
        <Text
          style={
            isSourceCard
              ? styles.sourceTitle
              : isHookCard
              ? styles.hookTitle
              : styles.title
          }
        >
          {title}
        </Text>

        {isSourceCard ? (
          <TouchableOpacity onPress={onSourcePress} style={styles.sourceButton}>
            <Text style={styles.sourceButtonText}>View Source</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.bodyWrapper}>
            <Text style={styles.body}>{body}</Text>
          </View>
        )}
      </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB', // light grey background
    justifyContent: 'center',
    padding: 24,
  },
  sourceContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black', // light grey background
    justifyContent: 'center',
    padding: 24,
  },
  cardContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  hookCardContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
  },
  title: {
    color: '#000',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
    marginTop: -150,
  },
  sourceTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
  },
  hookTitle: {
    color: '#374151',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
    marginTop: 50,
  },
  body: {
    color: '#374151', // dark grey
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'SF-Pro-Display',
  },
  sourceButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'darkgrey',
    borderRadius: 10,
    alignItems: 'center',
  },
  sourceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  bodyWrapper: {
    marginTop: 80, // Adjust this value to control how low the body starts
  },
  topicTags: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
});
