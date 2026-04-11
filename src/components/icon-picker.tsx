"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";
import {
  Folder,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Users,
  Mail,
  FileText,
  Settings,
  Globe,
  Megaphone,
  TrendingUp,
  Calculator,
  Briefcase,
  Building2,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Star,
  Heart,
  Bookmark,
  Tag,
  Package,
  Truck,
  CreditCard,
  Receipt,
  PieChart,
  LineChart,
  Target,
  Zap,
  Lightbulb,
  Wrench,
  Database,
  Shield,
  Lock,
  Eye,
  Camera,
  Image,
  Video,
  Music,
  Headphones,
  Palette,
  Pen,
  BookOpen,
  GraduationCap,
  Award,
  Trophy,
  Rocket,
  Sparkles,
  Coffee,
  Utensils,
  Home,
  MapPin,
  Navigation,
  Layers,
  Grid3X3,
  LayoutDashboard,
  Monitor,
  Smartphone,
  Laptop,
  Printer,
  Wifi,
  Cloud,
  type LucideIcon,
} from "lucide-react";

interface IconEntry {
  name: string;
  icon: LucideIcon;
  tags: string;
}

const ICONS: IconEntry[] = [
  { name: "folder", icon: Folder, tags: "file directory category" },
  { name: "shopping-cart", icon: ShoppingCart, tags: "buy ecommerce store" },
  { name: "dollar-sign", icon: DollarSign, tags: "money price finance payment" },
  { name: "bar-chart-3", icon: BarChart3, tags: "analytics stats chart graph" },
  { name: "users", icon: Users, tags: "people team group hr" },
  { name: "mail", icon: Mail, tags: "email message letter" },
  { name: "file-text", icon: FileText, tags: "document paper report" },
  { name: "settings", icon: Settings, tags: "gear config preferences" },
  { name: "globe", icon: Globe, tags: "world web internet" },
  { name: "megaphone", icon: Megaphone, tags: "marketing announce promote" },
  { name: "trending-up", icon: TrendingUp, tags: "growth sales chart" },
  { name: "calculator", icon: Calculator, tags: "math finance accounting" },
  { name: "briefcase", icon: Briefcase, tags: "work job business" },
  { name: "building-2", icon: Building2, tags: "company office corporate" },
  { name: "phone", icon: Phone, tags: "call contact mobile" },
  { name: "message-square", icon: MessageSquare, tags: "chat comment feedback" },
  { name: "calendar", icon: Calendar, tags: "date schedule event" },
  { name: "clock", icon: Clock, tags: "time schedule hour" },
  { name: "star", icon: Star, tags: "favorite rating review" },
  { name: "heart", icon: Heart, tags: "love like favorite" },
  { name: "bookmark", icon: Bookmark, tags: "save mark favorite" },
  { name: "tag", icon: Tag, tags: "label price category" },
  { name: "package", icon: Package, tags: "box product shipping" },
  { name: "truck", icon: Truck, tags: "delivery shipping logistics" },
  { name: "credit-card", icon: CreditCard, tags: "payment card bank" },
  { name: "receipt", icon: Receipt, tags: "invoice bill payment" },
  { name: "pie-chart", icon: PieChart, tags: "analytics data chart" },
  { name: "line-chart", icon: LineChart, tags: "analytics data trend" },
  { name: "target", icon: Target, tags: "goal aim marketing" },
  { name: "zap", icon: Zap, tags: "lightning energy power fast" },
  { name: "lightbulb", icon: Lightbulb, tags: "idea creative innovation" },
  { name: "wrench", icon: Wrench, tags: "tool fix repair" },
  { name: "database", icon: Database, tags: "data storage server" },
  { name: "shield", icon: Shield, tags: "security protect safe" },
  { name: "lock", icon: Lock, tags: "security password private" },
  { name: "eye", icon: Eye, tags: "view see visible" },
  { name: "camera", icon: Camera, tags: "photo picture image" },
  { name: "image", icon: Image, tags: "photo picture media" },
  { name: "video", icon: Video, tags: "film record media" },
  { name: "music", icon: Music, tags: "audio sound media" },
  { name: "headphones", icon: Headphones, tags: "audio music listen" },
  { name: "palette", icon: Palette, tags: "design color art creative" },
  { name: "pen", icon: Pen, tags: "write edit draw" },
  { name: "book-open", icon: BookOpen, tags: "read learn education" },
  { name: "graduation-cap", icon: GraduationCap, tags: "education school learn" },
  { name: "award", icon: Award, tags: "prize achievement badge" },
  { name: "trophy", icon: Trophy, tags: "winner prize competition" },
  { name: "rocket", icon: Rocket, tags: "launch startup fast" },
  { name: "sparkles", icon: Sparkles, tags: "ai magic new" },
  { name: "coffee", icon: Coffee, tags: "drink cafe food" },
  { name: "utensils", icon: Utensils, tags: "food restaurant fnb dining" },
  { name: "home", icon: Home, tags: "house property real estate" },
  { name: "map-pin", icon: MapPin, tags: "location place address" },
  { name: "navigation", icon: Navigation, tags: "direction map compass" },
  { name: "layers", icon: Layers, tags: "stack level tier" },
  { name: "grid-3x3", icon: Grid3X3, tags: "grid layout table" },
  { name: "layout-dashboard", icon: LayoutDashboard, tags: "dashboard overview" },
  { name: "monitor", icon: Monitor, tags: "screen display computer" },
  { name: "smartphone", icon: Smartphone, tags: "mobile phone device" },
  { name: "laptop", icon: Laptop, tags: "computer device work" },
  { name: "printer", icon: Printer, tags: "print document paper" },
  { name: "wifi", icon: Wifi, tags: "internet connection network" },
  { name: "cloud", icon: Cloud, tags: "storage online hosting" },
];

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ICONS;
    const q = search.toLowerCase();
    return ICONS.filter(
      (i) => i.name.includes(q) || i.tags.includes(q)
    );
  }, [search]);

  const selectedIcon = ICONS.find((i) => i.name === value);
  const SelectedComponent = selectedIcon?.icon ?? Folder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-sm transition-colors hover:bg-slate-50">
        <span className="flex items-center gap-2 truncate">
          <SelectedComponent className="h-4 w-4 shrink-0" />
          <span className="truncate">{value || "Select icon"}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
        <div className="grid max-h-60 grid-cols-6 gap-0.5 overflow-y-auto p-2">
          {filtered.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => {
                onChange(name);
                setOpen(false);
                setSearch("");
              }}
              title={name}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-yellow-50",
                value === name
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-slate-600"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-6 py-4 text-center text-xs text-muted-foreground">
              No icons match &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
