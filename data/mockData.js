export const USER = {
  name: 'Pierre',
  points: 1250,
  streak: 4,
  class: 'Grade 5 - Ms. Miller',
  school: 'Chedoke Elementary',
  city: 'Hamilton, ON',
  avatar: '🧑‍🎓',
};

export const BADGES = {
  rookie_recycler: { name: 'Rookie Recycler', requirement: 10, emoji: '🌱', description: 'Recycle 10 items' },
  eco_warrior: { name: 'Eco Warrior', requirement: 50, emoji: '🦸', description: 'Recycle 50 items' },
  green_champion: { name: 'Green Champion', requirement: 100, emoji: '🏆', description: 'Recycle 100 items' },
  planet_saver: { name: 'Planet Saver', requirement: 500, emoji: '🌍', description: 'Recycle 500 items' },
  streak_starter: { name: 'Streak Starter', requirement: 3, type: 'streak', emoji: '🔥', description: '3 Day Streak' },
  streak_master: { name: 'Streak Master', requirement: 7, type: 'streak', emoji: '⚡', description: '7 Day Streak' }
};

// My Class - Students in Grade 5 - Ms. Miller
export const CLASS_LEADERBOARD = [
  { id: 1, name: 'Sarah', points: 1550, avatar: '👧' },
  { id: 2, name: 'Marcus', points: 1420, avatar: '👦' },
  { id: 3, name: 'Pierre', points: 1250, avatar: '🧑‍🎓' },
  { id: 4, name: 'Emma', points: 1180, avatar: '👧🏻' },
  { id: 5, name: 'Jake', points: 1050, avatar: '👦🏼' },
  { id: 6, name: 'Olivia', points: 980, avatar: '👧🏽' },
  { id: 7, name: 'Noah', points: 920, avatar: '👦🏾' },
  { id: 8, name: 'Mia', points: 875, avatar: '👧🏼' },
  { id: 9, name: 'Liam', points: 820, avatar: '👦🏻' },
  { id: 10, name: 'Ava', points: 745, avatar: '👧🏾' },
];

// School - Different classes competing
export const SCHOOL_LEADERBOARD = [
  { id: 1, name: 'Class 5A', points: 15800, teacher: 'Ms. Johnson', members: 24, emoji: '🏆' },
  { id: 2, name: 'Class 4B', points: 14200, teacher: 'Mr. Williams', members: 22, emoji: '🥈', isUserClass: true },
  { id: 3, name: 'Class 6B', points: 13500, teacher: 'Mrs. Davis', members: 25, emoji: '🥉' },
  { id: 4, name: 'Class 3A', points: 12100, teacher: 'Mr. Brown', members: 23, emoji: '🌟' },
  { id: 5, name: 'Class 5B', points: 11800, teacher: 'Ms. Garcia', members: 24, emoji: '⭐' },
  { id: 6, name: 'Class 4A', points: 10900, teacher: 'Mrs. Miller', members: 22, emoji: '🌱' },
  { id: 7, name: 'Class 6A', points: 10200, teacher: 'Mr. Wilson', members: 26, emoji: '🌿' },
  { id: 8, name: 'Class 3B', points: 9500, teacher: 'Ms. Anderson', members: 21, emoji: '🍀' },
];

// Global - Top Elementary Schools in Ontario (Hamilton & Toronto)
export const GLOBAL_LEADERBOARD = [
  { id: 1, name: 'Chedoke Elementary', points: 285000, country: '🇨🇦', city: 'Hamilton, ON', students: 380 },
  { id: 2, name: 'Rosedale Heights Elementary', points: 267000, country: '🇨🇦', city: 'Toronto, ON', students: 420 },
  { id: 3, name: 'Westmount Elementary', points: 245000, country: '🇨🇦', city: 'Hamilton, ON', students: 350 },
  { id: 4, name: 'Deer Park Elementary', points: 232000, country: '🇨🇦', city: 'Toronto, ON', students: 390 },
  { id: 5, name: 'Greenwood Elementary', points: 198000, country: '🇨🇦', city: 'Hamilton, ON', students: 340, isUserSchool: true },
  { id: 6, name: 'Bloordale Elementary', points: 187000, country: '🇨🇦', city: 'Toronto, ON', students: 365 },
  { id: 7, name: 'Dundas Central Elementary', points: 176000, country: '🇨🇦', city: 'Hamilton, ON', students: 310 },
  { id: 8, name: 'Humewood Elementary', points: 165000, country: '🇨🇦', city: 'Toronto, ON', students: 335 },
  { id: 9, name: 'Ancaster Meadow Elementary', points: 154000, country: '🇨🇦', city: 'Hamilton, ON', students: 295 },
  { id: 10, name: 'Jackman Avenue Elementary', points: 143000, country: '🇨🇦', city: 'Toronto, ON', students: 280 },
];

// Keep old LEADERBOARD for backwards compatibility
export const LEADERBOARD = CLASS_LEADERBOARD;

export const FEED_DATA = [
  { id: 1, text: "Sarah recycled a Milk Carton 🥛", time: "2m ago" },
  { id: 2, text: "Mr. Jones approved a Sapling 🌱", time: "15m ago" },
  { id: 3, text: "Pierre just recycled a Laptop! 💻", time: "1h ago" },
  { id: 4, text: "Class 4B reached 80% goal! 🎉", time: "2h ago" },
  { id: 5, text: "Ms. Smith's class just planted a sapling! 🌱", time: "3h ago" },
];

export const CRAFT_RECIPES = [
  { id: 1, name: "Robot Pencil Holder", items: ["Tin Can", "Bottle Caps", "Wire"], emoji: "🤖", difficulty: "Easy" },
  { id: 2, name: "Cardboard Castle", items: ["Shoebox", "Toilet Roll", "Paint"], emoji: "🏰", difficulty: "Medium" },
  { id: 3, name: "Bottle Rocket", items: ["Plastic Bottle", "Cardboard", "Tape"], emoji: "🚀", difficulty: "Hard" },
];

// User's Completed Crafts
export const MY_CRAFTS = [
  {
    id: 1,
    name: "Robot Pencil Holder",
    emoji: "🤖",
    completedDate: "Jan 8",
    points: 75,
    approved: true,
  },
  {
    id: 2,
    name: "Cardboard Birdhouse",
    emoji: "🏠",
    completedDate: "Jan 5",
    points: 100,
    approved: true,
  },
  {
    id: 3,
    name: "Bottle Cap Art",
    emoji: "🎨",
    completedDate: "Jan 3",
    points: 50,
    approved: true,
  },
];

// Challenges Data
export const CHALLENGES = {
  daily: [
    { id: 'd1', name: 'Recycle 3 Plastic Bottles', emoji: '🍶', points: 50, progress: 1, goal: 3, type: 'daily' },
    { id: 'd2', name: 'Scan 5 Items', emoji: '📸', points: 30, progress: 3, goal: 5, type: 'daily' },
    { id: 'd3', name: 'Make 1 Craft', emoji: '🎨', points: 75, progress: 0, goal: 1, type: 'daily' },
  ],
  weekly: [
    { id: 'w1', name: 'Recycle 20 Items', emoji: '♻️', points: 200, progress: 12, goal: 20, type: 'weekly' },
    { id: 'w2', name: 'Keep a 5-Day Streak', emoji: '🔥', points: 150, progress: 4, goal: 5, type: 'weekly' },
    { id: 'w3', name: 'Help 3 Classmates', emoji: '🤝', points: 100, progress: 1, goal: 3, type: 'weekly' },
    { id: 'w4', name: 'Complete 3 Crafts', emoji: '🛠️', points: 250, progress: 2, goal: 3, type: 'weekly' },
  ],
  special: [
    { id: 's1', name: 'Earth Day Hero', emoji: '🌍', points: 500, progress: 0, goal: 1, type: 'special', description: 'Recycle 50 items on Earth Day!', endDate: 'Apr 22' },
    { id: 's2', name: 'Class Champion', emoji: '🏆', points: 1000, progress: 14200, goal: 20000, type: 'special', description: 'Help your class reach 20k points!', endDate: 'Jan 31' },
    { id: 's3', name: 'Craft Master', emoji: '🎭', points: 300, progress: 5, goal: 10, type: 'special', description: 'Complete 10 different crafts!', endDate: 'Feb 14' },
  ]
};
