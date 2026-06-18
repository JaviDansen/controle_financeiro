import React from 'react';
import {
  UtensilsCrossed, Car, Stethoscope, Home, Tv2,
  Gamepad2, TrendingUp, Briefcase, ShoppingBag,
  Zap, GraduationCap, Shirt, Baby, PawPrint,
  Plane, Music, BookOpen, Dumbbell, Coffee,
  Gift, Wrench, Building2, CircleDollarSign,
  HelpCircle,
} from 'lucide-react-native';

export interface IconDef {
  key: string;
  label: string;
  component: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  defaultColor: string;
}

export const CATEGORY_ICONS: IconDef[] = [
  { key: 'utensils',    label: 'Alimentação',   component: UtensilsCrossed,    defaultColor: '#C07830' },
  { key: 'car',         label: 'Transporte',     component: Car,                defaultColor: '#3B5DA0' },
  { key: 'stethoscope', label: 'Saúde',          component: Stethoscope,        defaultColor: '#B04040' },
  { key: 'home',        label: 'Moradia',        component: Home,               defaultColor: '#3D8B4E' },
  { key: 'tv',          label: 'Assinaturas',    component: Tv2,                defaultColor: '#6B4EA0' },
  { key: 'gamepad',     label: 'Lazer',          component: Gamepad2,           defaultColor: '#9A8030' },
  { key: 'trending',    label: 'Receita',        component: TrendingUp,         defaultColor: '#3D8B4E' },
  { key: 'briefcase',   label: 'Freelance',      component: Briefcase,          defaultColor: '#2E7A8A' },
  { key: 'shopping',    label: 'Compras',        component: ShoppingBag,        defaultColor: '#A03070' },
  { key: 'zap',         label: 'Contas',         component: Zap,                defaultColor: '#D4813A' },
  { key: 'graduation',  label: 'Educação',       component: GraduationCap,      defaultColor: '#4A7A4A' },
  { key: 'shirt',       label: 'Vestuário',      component: Shirt,              defaultColor: '#7A4A8A' },
  { key: 'baby',        label: 'Filhos',         component: Baby,               defaultColor: '#D4606A' },
  { key: 'paw',         label: 'Pets',           component: PawPrint,           defaultColor: '#8A6A3A' },
  { key: 'plane',       label: 'Viagens',        component: Plane,              defaultColor: '#2A7A9A' },
  { key: 'music',       label: 'Entretenimento', component: Music,              defaultColor: '#8A3A7A' },
  { key: 'book',        label: 'Livros',         component: BookOpen,           defaultColor: '#4A6A4A' },
  { key: 'dumbbell',    label: 'Academia',       component: Dumbbell,           defaultColor: '#5A4AA0' },
  { key: 'coffee',      label: 'Café',           component: Coffee,             defaultColor: '#8A5A2A' },
  { key: 'gift',        label: 'Presentes',      component: Gift,               defaultColor: '#C03060' },
  { key: 'wrench',      label: 'Manutenção',     component: Wrench,             defaultColor: '#6A6A3A' },
  { key: 'building',    label: 'Empresa',        component: Building2,          defaultColor: '#3A5A8A' },
  { key: 'dollar',      label: 'Investimento',   component: CircleDollarSign,   defaultColor: '#2A8A5A' },
];

export const ICON_MAP: Record<string, IconDef['component']> = Object.fromEntries(
  CATEGORY_ICONS.map(i => [i.key, i.component])
);

export function getCategoryIcon(key: string | null | undefined) {
  return key ? (ICON_MAP[key] ?? HelpCircle) : HelpCircle;
}
