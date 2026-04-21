import type { Location, Activity, TourPackage, TravelerReview } from '../types'

export const locations: Location[] = [
  { id: 'alegria', name: 'Alegria', activityCount: 12, image: 'https://picsum.photos/seed/alegria1/400/300' },
  { id: 'moalboal', name: 'Moalboal', activityCount: 8, image: 'https://picsum.photos/seed/moalboal2/400/300' },
  { id: 'oslob', name: 'Oslob', activityCount: 6, image: 'https://picsum.photos/seed/oslob3/400/300' },
  { id: 'cebu-city', name: 'Cebu City', activityCount: 15, image: 'https://picsum.photos/seed/cebucity4/400/300' },
  { id: 'bantayan', name: 'Bantayan Island', activityCount: 10, image: 'https://picsum.photos/seed/bantayan5/400/300' },
  { id: 'malapascua', name: 'Malapascua', activityCount: 7, image: 'https://picsum.photos/seed/malapascua6/400/300' },
  { id: 'kawasan', name: 'Kawasan Falls', activityCount: 5, image: 'https://picsum.photos/seed/kawasan7/400/300' },
  { id: 'camotes', name: 'Camotes Island', activityCount: 9, image: 'https://picsum.photos/seed/camotes8/400/300' },
]

export const activityCategories: string[] = ['Diving', 'Culture', 'Canyoneering', 'Beach', 'Museums', 'History']

export const activities: Activity[] = [
  { id: 1, category: 'Canyoneering', title: 'Alegria Canyoneering', location: 'Alegria, Cebu', rating: 4.5, reviewCount: 128, price: 2500, image: 'https://picsum.photos/seed/act1/400/280', municipalityId: 'alegria' },
  { id: 2, category: 'Canyoneering', title: 'Kawasan Falls Trek', location: 'Alegria, Cebu', rating: 4.7, reviewCount: 96, price: 1800, image: 'https://picsum.photos/seed/act2/400/280', municipalityId: 'alegria' },
  { id: 3, category: 'Diving', title: 'Sardine Run Dive', location: 'Moalboal, Cebu', rating: 4.8, reviewCount: 204, price: 3500, image: 'https://picsum.photos/seed/act3/400/280', municipalityId: 'moalboal' },
  { id: 4, category: 'Diving', title: 'Whale Shark Swimming', location: 'Oslob, Cebu', rating: 4.6, reviewCount: 312, price: 2200, image: 'https://picsum.photos/seed/act4/400/280', municipalityId: 'oslob' },
  { id: 5, category: 'Culture', title: 'Heritage Walk Tour', location: 'Cebu City, Cebu', rating: 4.3, reviewCount: 75, price: 1200, image: 'https://picsum.photos/seed/act5/400/280', municipalityId: 'cebu-city' },
  { id: 6, category: 'Beach', title: 'Island Hopping', location: 'Bantayan Island, Cebu', rating: 4.9, reviewCount: 187, price: 2800, image: 'https://picsum.photos/seed/act6/400/280', municipalityId: 'bantayan' },
  { id: 7, category: 'Diving', title: 'Thresher Shark Diving', location: 'Malapascua, Cebu', rating: 4.7, reviewCount: 143, price: 4200, image: 'https://picsum.photos/seed/act7/400/280', municipalityId: 'malapascua' },
  { id: 8, category: 'Canyoneering', title: 'Alegria Cliff Jumping', location: 'Alegria, Cebu', rating: 4.4, reviewCount: 89, price: 1500, image: 'https://picsum.photos/seed/act8/400/280', municipalityId: 'alegria' },
  { id: 9, category: 'Culture', title: 'Sinulog Festival Tour', location: 'Cebu City, Cebu', rating: 4.6, reviewCount: 211, price: 1800, image: 'https://picsum.photos/seed/act9/400/280', municipalityId: 'cebu-city' },
  { id: 10, category: 'Beach', title: 'Snorkeling Adventure', location: 'Moalboal, Cebu', rating: 4.5, reviewCount: 164, price: 1600, image: 'https://picsum.photos/seed/act10/400/280', municipalityId: 'moalboal' },
  { id: 11, category: 'History', title: "Magellan's Cross Visit", location: 'Cebu City, Cebu', rating: 4.2, reviewCount: 58, price: 900, image: 'https://picsum.photos/seed/act11/400/280', municipalityId: 'cebu-city' },
  { id: 12, category: 'Beach', title: 'Camotes Beach Escape', location: 'Camotes Island, Cebu', rating: 4.8, reviewCount: 132, price: 3200, image: 'https://picsum.photos/seed/act12/400/280', municipalityId: 'camotes' },
]

export const tourPackages: TourPackage[] = [
  { id: 1, title: 'Southern Cebu Tour', description: 'Experience the best of southern Cebu — canyoneering, whale sharks, and stunning waterfalls in one epic adventure.', price: 4500, image: 'https://picsum.photos/seed/pkg1/600/400', theme: 'green', duration: '2 Days / 1 Night', inclusions: ['Canyoneering', 'Whale Shark Watching', 'Hotel Stay', 'Meals'], municipalityId: 'alegria' },
  { id: 2, title: 'Ruins of Cebu', description: "Explore the rich historical landmarks and cultural heritage sites that tell the story of Cebu's glorious past.", price: 3500, image: 'https://picsum.photos/seed/pkg2/600/400', theme: 'orange', duration: '1 Day', inclusions: ['Heritage Walk', 'Museum Entry', 'Local Lunch', 'Guide'], municipalityId: 'cebu-city' },
  { id: 3, title: 'Island Hopping Adventure', description: 'Hop across the pristine islands of Cebu, snorkel in crystal-clear waters, and enjoy white sand beaches.', price: 5200, image: 'https://picsum.photos/seed/pkg3/600/400', theme: 'green', duration: '3 Days / 2 Nights', inclusions: ['Ferry Transfers', 'Snorkeling', 'Hotel Stay', 'Breakfast'], municipalityId: 'bantayan' },
  { id: 4, title: 'Dive & Discover Cebu', description: 'Dive into the world-class dive sites of Moalboal and Malapascua — sardine runs, thresher sharks and coral gardens.', price: 6800, image: 'https://picsum.photos/seed/pkg4/600/400', theme: 'blue', duration: '4 Days / 3 Nights', inclusions: ['Dive Equipment', 'Dive Guide', 'Hotel Stay', 'All Meals'], municipalityId: 'moalboal' },
]

export const tourOperators: string[] = [
  'Summit Seekers Travel',
  'WildPath Adventures',
  'TerraQuest Tours',
  'Cebu Island Explorers',
  'Blue Water Travels',
]

export const travelerReviews: TravelerReview[] = [
  { id: 1, name: 'Maria Santos', avatar: 'https://picsum.photos/seed/rev1/60/60', rating: 5, activityTitle: 'Tuko Alegria Canyoneering', date: 'March 2025', text: 'Absolutely incredible experience! The guides were professional and the scenery was breathtaking. Would recommend to everyone.' },
  { id: 2, name: 'John Cruz', avatar: 'https://picsum.photos/seed/rev2/60/60', rating: 4, activityTitle: 'Tuko Alegria Canyoneering', date: 'February 2025', text: 'Great adventure, well organized. The canyoneering trail was challenging but so rewarding at the end!' },
]
