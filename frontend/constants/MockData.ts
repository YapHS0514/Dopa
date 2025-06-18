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

export const MOCK_FACTS = [
  {
    id: '1',
    hook: 'Did you know that honey never spoils?',
    summary: 'Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!',
    fullContent: `Honey's unique chemical properties make it one of the only foods that never spoils. Its low moisture content and high acidity create an environment where bacteria and microorganisms can't survive. Additionally, bees add an enzyme that produces hydrogen peroxide, further preserving the honey.

This is why perfectly preserved honey has been found in ancient Egyptian tombs, still edible after thousands of years. The ancient Egyptians even used honey in their mummification processes and as a natural antibiotic.`,
    image: 'https://example.com/honey.jpg',
    topic: 'science',
    source: 'National Geographic',
    sourceUrl: 'https://www.nationalgeographic.com/science/article/honey-food-preservation',
    readTime: 2
  },
  {
    id: '2',
    hook: 'Did you know that octopuses have 9 brains?',
    summary: 'An octopus has one central brain, plus eight additional brains - one in each of its arms!',
    fullContent: `The octopus's nervous system is a marvel of nature. While they have one central brain that controls the animal's primary functions, each of their eight arms contains its own brain-like ganglion. These mini-brains allow each arm to think and move independently.

This distributed nervous system enables octopuses to solve complex puzzles, manipulate objects with incredible precision, and even change their skin color and texture instantly. Scientists believe this unique neural architecture makes octopuses one of the most intelligent invertebrates on Earth.`,
    image: 'https://example.com/octopus.jpg',
    topic: 'nature',
    source: 'Scientific American',
    sourceUrl: 'https://www.scientificamerican.com/article/octopus-intelligence',
    readTime: 2
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