export type Category = { slug: string; label: string; icon: string };

// Icons are keys into <CategoryIcon />
export const CATEGORIES: Category[] = [
  { slug: "vehicles", label: "Vehicles", icon: "car" },
  { slug: "property-rentals", label: "Property Rentals", icon: "home" },
  { slug: "apparel", label: "Apparel", icon: "shirt" },
  { slug: "electronics", label: "Electronics", icon: "phone" },
  { slug: "entertainment", label: "Entertainment", icon: "film" },
  { slug: "family", label: "Family", icon: "heart" },
  { slug: "free-stuff", label: "Free Stuff", icon: "gift" },
  { slug: "garden-outdoor", label: "Garden & Outdoor", icon: "leaf" },
  { slug: "hobbies", label: "Hobbies", icon: "palette" },
  { slug: "home-goods", label: "Home Goods", icon: "sofa" },
  { slug: "home-improvement", label: "Home Improvement", icon: "hammer" },
  { slug: "musical-instruments", label: "Musical Instruments", icon: "music" },
  { slug: "office-supplies", label: "Office Supplies", icon: "briefcase" },
  { slug: "pet-supplies", label: "Pet Supplies", icon: "paw" },
  { slug: "sporting-goods", label: "Sporting Goods", icon: "ball" },
  { slug: "toys-games", label: "Toys & Games", icon: "puzzle" },
];

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
