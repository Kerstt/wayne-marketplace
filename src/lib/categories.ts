// `icon` is a key into <CategoryIcon />; `tint` is the category's swatch colour.
export type Category = { slug: string; label: string; icon: string; tint: string };

export const CATEGORIES: Category[] = [
  { slug: "vehicles", label: "Vehicles", icon: "car", tint: "#FFD3BF" },
  { slug: "property-rentals", label: "Rentals", icon: "home", tint: "#D3E6CB" },
  { slug: "apparel", label: "Apparel", icon: "shirt", tint: "#F5CFDF" },
  { slug: "electronics", label: "Electronics", icon: "phone", tint: "#CFDDF6" },
  { slug: "entertainment", label: "Entertainment", icon: "film", tint: "#E3D5F6" },
  { slug: "family", label: "Family", icon: "heart", tint: "#FBDDBA" },
  { slug: "free-stuff", label: "Free Stuff", icon: "gift", tint: "#FFEC94" },
  { slug: "garden-outdoor", label: "Garden", icon: "leaf", tint: "#C9E6D3" },
  { slug: "hobbies", label: "Hobbies", icon: "palette", tint: "#F8D2C2" },
  { slug: "home-goods", label: "Home Goods", icon: "sofa", tint: "#E6DCC9" },
  { slug: "home-improvement", label: "DIY & Tools", icon: "hammer", tint: "#D6DFE5" },
  { slug: "musical-instruments", label: "Music", icon: "music", tint: "#F1CFCF" },
  { slug: "office-supplies", label: "Office", icon: "briefcase", tint: "#DFE3C6" },
  { slug: "pet-supplies", label: "Pets", icon: "paw", tint: "#F5DCBE" },
  { slug: "sporting-goods", label: "Sports", icon: "ball", tint: "#C8E0EC" },
  { slug: "toys-games", label: "Toys & Games", icon: "puzzle", tint: "#F9CFE5" },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(slug: string) {
  return getCategory(slug)?.label ?? slug;
}
