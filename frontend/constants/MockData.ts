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

export const MOCK_FACTS = [
  {
    id: '1',
    hook: 'Honey never spoils',
    summary: 'Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!',
    fullContent: `Honey's unique chemical properties make it one of the only foods that never spoils. Its low moisture content and high acidity create an environment where bacteria and microorganisms can't survive. Additionally, bees add an enzyme that produces hydrogen peroxide, further preserving the honey. This is why perfectly preserved honey has been found in ancient Egyptian tombs, still edible after thousands of years. The ancient Egyptians even used honey in their mummification processes and as a natural antibiotic.`,
    image: 'https://example.com/honey.jpg',
    topic: 'science',
    source: 'National Geographic',
    sourceUrl: 'https://www.nationalgeographic.com/science/article/honey-food-preservation',
    readTime: 2
  },
  {
    id: '2',
    hook: 'Octopuses have 9 brains',
    summary: 'An octopus has one central brain, plus eight additional brains - one in each of its arms!',
    fullContent: `The octopus's nervous system is a marvel of nature. While they have one central brain that controls the animal's primary functions, each of their eight arms contains its own brain-like ganglion. These mini-brains allow each arm to think and move independently. This distributed nervous system enables octopuses to solve complex puzzles, manipulate objects with incredible precision, and even change their skin color and texture instantly. Scientists believe this unique neural architecture makes octopuses one of the most intelligent invertebrates on Earth.`,
    image: 'https://example.com/octopus.jpg',
    topic: 'nature',
    source: 'Scientific American',
    sourceUrl: 'https://www.scientificamerican.com/article/octopus-intelligence',
    readTime: 2
  },
  {
    id: '3',
    hook: 'Giant Pacific octopus has three hearts and blue blood',
    summary: 'The giant Pacific octopus circulates blood using three hearts and has copper-based blue blood!',
    fullContent: `Octopuses have two branchial hearts that pump blood through the gills, and one systemic heart that circulates it to the rest of the body. Their blue blood comes from hemocyanin, a copper-rich molecule that is more efficient in cold, low-oxygen environments. These traits help them thrive in deep ocean habitats.`,
    image: 'https://example.com/octopus_blueblood.jpg',
    topic: 'nature',
    source: 'AP News',
    sourceUrl: 'https://apnews.com/article/...giant-pacific-octopus-blue-blood', // AP summarization
    readTime: 2
  },
  {
    id: '4',
    hook: 'Octopus arms can act independently',
    summary: 'Each arm of an octopus has mini "brains" that can operate independently of the central brain.',
    fullContent: `Each of an octopus's eight arms contains large peripheral ganglia—mini nervous systems with neurons that let the arm sense and move without input from the central brain. In experiments, octopus arms could navigate mazes even when detached from visual input.`,
    image: 'https://example.com/octopus_arm.jpg',
    topic: 'nature',
    source: 'Scientific American',
    sourceUrl: 'https://www.scientificamerican.com/article/how-octopus-arms-bypass-the-brain/' ,
    readTime: 2
  },
  {
    id: '5',
    hook: 'Honey contains natural antibiotics',
    summary: 'Honey produces hydrogen peroxide and is naturally antibacterial—ancient Egyptians used it on wounds.',
    fullContent: `Honey contains the enzyme glucose oxidase, which produces hydrogen peroxide when diluted, giving it broad-spectrum antibacterial properties. This is why honey was historically used in wound care and is still used in modern medicinal bandages.`,
    image: 'https://example.com/honey_antibiotic.jpg',
    topic: 'science',
    source: 'Mental Floss',
    sourceUrl: 'https://www.mentalfloss.com/article/68528/15-honey-facts-worth-buzzing-about',
    readTime: 2
  },
  {
    id: '6',
    hook: 'Honey is a natural energy booster',
    summary: 'Honey offers a quick energy boost with sustained carbohydrates, ideal for athletes.',
    fullContent: `Honey’s natural sugars—primarily glucose and fructose—provide fast-acting energy, while amino acids, peptides, and lipids contribute to a slower release. It’s often used by athletes for sustained energy and better performance.`,
    image: 'https://example.com/honey_energy.jpg',
    topic: 'science',
    source: 'Sioux Honey Association',
    sourceUrl: 'https://siouxhoney.com/12-honey-myths-vs-facts/',
    readTime: 1
  },
  {
    id: '7',
    hook: 'Honey never spoils (when stored properly)',
    summary: 'Properly stored honey is safe to eat indefinitely—even decades later!',
    fullContent: `Due to its low moisture content and acidic pH, honey resists bacterial growth. Stored in airtight containers at room temperature, it remains edible indefinitely. Even crystallized honey can be revived with a warm water bath.`,
    image: 'https://example.com/honey_eternal.jpg',
    topic: 'science',
    source: 'Mississippi State University Extension',
    sourceUrl: 'https://extension.msstate.edu/blog/does-honey-go-bad',
    readTime: 1
  },
  {
    id: '8',
    hook: 'Octopuses have nearly as many neurons as dogs',
    summary: 'Octopuses possess around 500 million neurons—comparable to dogs.',
    fullContent: `A common octopus (Octopus vulgaris) has approximately 500 million neurons—about two-thirds in its arms. This is on par with dogs and underpins their sophisticated problem-solving, memory, and tool use abilities.`,
    image: 'https://example.com/octopus_neurons.jpg',
    topic: 'nature',
    source: 'NHM (Natural History Museum, UK)',
    sourceUrl: 'https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html',
    readTime: 2
  },
  {
    id: '9',
    hook: 'Octopus arms can taste and feel',
    summary: 'Each sucker on an octopus arm has ~10,000 neurons for touch and chemical sensing.',
    fullContent: `Each sucker on an octopus’s arm contains around 10,000 neurons, enabling it to taste and feel objects. These suckers relay sensory information independently, allowing precise, tactile exploration.`,
    image: 'https://example.com/octopus_sucker.jpg',
    topic: 'nature',
    source: 'Scientific American',
    sourceUrl: 'https://www.scientificamerican.com/article/the-mind-of-an-octopus/',
    readTime: 2
  },
  {
    id: '10',
    hook: 'Honeycomb cells are hexagonal for efficiency',
    summary: 'Bees build hexagonal honeycomb cells to maximize space and minimize wax use.',
    fullContent: `Bees construct hexagonal cells because hexagons pack tightly with minimal wall material, maximizing storage space while reducing wax use. This natural optimization conserves energy and materials.`,
    image: 'https://example.com/honeycomb_hexagon.jpg',
    topic: 'science',
    source: 'Kinghaven Farms',
    sourceUrl: 'https://kinghavenfarms.com/blogs/from-the-hive/12-sweet-facts-about-honey',
    readTime: 1
  },
  {
    id: '11',
    hook: 'Honey is hygroscopic',
    summary: 'Honey absorbs water from the air—so it must be stored sealed to prevent fermentation.',
    fullContent: `Honey is hygroscopic: it naturally absorbs moisture from the air. If stored unsealed, it can ferment as moisture triggers yeast activity. Airtight sealing prevents spoilage and preserves flavor.`,
    image: 'https://example.com/honey_hygroscopic.jpg',
    topic: 'science',
    source: 'Wikipedia (Honey)',
    sourceUrl: 'https://en.wikipedia.org/wiki/Honey',
    readTime: 2
  },
  {
    id: '12',
    hook: 'Octopus central brain wraps around its throat',
    summary: 'An octopus’s donut-shaped brain physically encircles its esophagus.',
    fullContent: `The central brain of an octopus is donut-shaped—it encircles the esophagus. Food passes through this "brain doughnut," meaning their nervous system wraps around their throat.`,
    image: 'https://example.com/octopus_brain_donut.jpg',
    topic: 'nature',
    source: 'OctoNation',
    sourceUrl: 'https://octonation.com/octopus-brain/',
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