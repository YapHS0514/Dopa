export interface Fact {
  id: string;
  fact: string;
  topic: 'Science' | 'Space' | 'Nature' | 'Tech' | 'Math' | 'Psychology';
  icon: string;
}

export const MOCK_FACTS: Fact[] = [
  {
    id: '1',
    fact: 'Your brain uses 20% of the total oxygen in your body.',
    topic: 'Science',
    icon: '🧬'
  },
  {
    id: '2',
    fact: 'One day on Venus is longer than one year on Venus.',
    topic: 'Space',
    icon: '🚀'
  },
  {
    id: '3',
    fact: 'The ocean contains 97% of Earth\'s water.',
    topic: 'Nature',
    icon: '🌊'
  },
  {
    id: '4',
    fact: 'The human brain can process images in as little as 13 milliseconds!',
    topic: 'Psychology',
    icon: '🧠'
  },
];

export const TOPICS = [
  {
    id: 'science',
    name: 'Science',
    description: 'Discover fascinating scientific facts about our universe, biology, chemistry, and more',
    icon: '🔬'
  },
  {
    id: 'history',
    name: 'History',
    description: 'Journey through time with interesting historical events, figures, and discoveries',
    icon: '📜'
  },
  {
    id: 'ai',
    name: 'AI & Tech',
    description: 'Stay updated with the latest in artificial intelligence and technology',
    icon: '🤖'
  },
  {
    id: 'space',
    name: 'Space',
    description: 'Explore the cosmos, from planets to distant galaxies',
    icon: '🚀'
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Learn about Earth\'s amazing wildlife, ecosystems, and natural phenomena',
    icon: '🌿'
  },
  {
    id: 'psychology',
    name: 'Psychology',
    description: 'Understand the human mind, behavior, and cognitive processes',
    icon: '🧠'
  }
];

export const BADGES = [
  {
    id: 'first_fact',
    title: 'Baby Steps',
    description: 'Read your first fact',
    xpReward: 50,
    coinReward: 100,
    icon: '👶'
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    xpReward: 200,
    coinReward: 300,
    icon: '🔥'
  },
  {
    id: 'topic_master',
    title: 'Topic Master',
    description: 'Read 50 facts from a single topic',
    xpReward: 500,
    coinReward: 1000,
    icon: '🎓'
  }
];

export const MARKETPLACE_ITEMS = [
  {
    id: 'streak_regain',
    title: 'Streak Saver',
    description: 'Regain your lost streak',
    price: 500,
    icon: '⚡'
  },
  {
    id: 'extra_facts',
    title: 'More Facts',
    description: 'Unlock 5 additional daily facts',
    price: 1000,
    icon: '📚'
  },
  {
    id: 'premium_week',
    title: '7-Day Premium',
    description: 'Access premium features for 7 days',
    price: 2000,
    icon: '⭐'
  }
]; 