import {
  Briefcase,
  Car,
  Dumbbell,
  Film,
  Gift,
  Hammer,
  Heart,
  Home,
  Leaf,
  Music,
  Palette,
  PawPrint,
  Puzzle,
  Shirt,
  Smartphone,
  Sofa,
  Store,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  car: Car,
  home: Home,
  shirt: Shirt,
  phone: Smartphone,
  film: Film,
  heart: Heart,
  gift: Gift,
  leaf: Leaf,
  palette: Palette,
  sofa: Sofa,
  hammer: Hammer,
  music: Music,
  briefcase: Briefcase,
  paw: PawPrint,
  ball: Dumbbell,
  puzzle: Puzzle,
  store: Store,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Store;
  return <Icon className={className} aria-hidden />;
}
