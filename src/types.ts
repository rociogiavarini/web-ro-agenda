export type SessionCategory =
  | 'mi_1er_recuerdo'
  | 'infantil_estudio'
  | 'exterior'
  | 'maternidad';

export type PackDefinition = {
  id: string;
  category: SessionCategory;
  name: string;
  price: number;
  digitalQty: number;
  printQty13x18: number;
  printQty20x30: number;
  hasFotolibro: boolean;
  imanesQty: number;
  maxBackgrounds?: number; // only for infantil_estudio
};

export type Booking = {
  id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  attendees: string;
  session_type: SessionCategory;
  pack_id: string;
  pack_name: string;
  pack_price: number;
  backgrounds_qty: number;
  selected_backgrounds?: string[];
  session_date: string; // ISO date string
  session_time: string;
  notes: string;
  cost?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'reservado' | 'pago_1' | 'pago_2' | 'pre_seleccion' | 'entregado';
  created_at?: string;
};

export const CATEGORY_LABELS: Record<SessionCategory, string> = {
  mi_1er_recuerdo: 'Mi 1er Recuerdo',
  infantil_estudio: 'Infantil Estudio',
  exterior: 'Infantil Exterior',
  maternidad: 'Maternidad',
};

export const CATEGORY_DESCRIPTIONS: Record<SessionCategory, string> = {
  mi_1er_recuerdo: 'Sesión newborn para los primeros días de tu bebé',
  infantil_estudio: 'Sesión en estudio con fondos y ambientaciones a tu elección',
  exterior: 'Sesión al aire libre en locaciones naturales',
  maternidad: 'Sesión especial para mamás durante el embarazo',
};

export const CATEGORY_EMOJIS: Record<SessionCategory, string> = {
  mi_1er_recuerdo: '🍼',
  infantil_estudio: '🎈',
  exterior: '🌿',
  maternidad: '🤰',
};

export const PACKS: PackDefinition[] = [
  // Mi 1er Recuerdo
  { id: 'mer_digital', category: 'mi_1er_recuerdo', name: 'Pack Digital', price: 60000, digitalQty: 8, printQty13x18: 0, printQty20x30: 0, hasFotolibro: false, imanesQty: 0 },
  { id: 'mer_plata', category: 'mi_1er_recuerdo', name: 'Pack Plata', price: 80000, digitalQty: 8, printQty13x18: 8, printQty20x30: 1, hasFotolibro: false, imanesQty: 0 },
  { id: 'mer_oro', category: 'mi_1er_recuerdo', name: 'Pack Oro', price: 100000, digitalQty: 12, printQty13x18: 12, printQty20x30: 2, hasFotolibro: false, imanesQty: 0 },
  { id: 'mer_vip', category: 'mi_1er_recuerdo', name: 'Pack VIP', price: 240000, digitalQty: 20, printQty13x18: 0, printQty20x30: 2, hasFotolibro: true, imanesQty: 14 },
  // Infantil Estudio
  { id: 'ie_digital', category: 'infantil_estudio', name: 'Pack Digital', price: 65000, digitalQty: 8, printQty13x18: 0, printQty20x30: 0, hasFotolibro: false, imanesQty: 0, maxBackgrounds: 1 },
  { id: 'ie_plata', category: 'infantil_estudio', name: 'Pack Plata', price: 80000, digitalQty: 8, printQty13x18: 8, printQty20x30: 1, hasFotolibro: false, imanesQty: 0, maxBackgrounds: 1 },
  { id: 'ie_oro', category: 'infantil_estudio', name: 'Pack Oro', price: 120000, digitalQty: 15, printQty13x18: 15, printQty20x30: 2, hasFotolibro: false, imanesQty: 0, maxBackgrounds: 2 },
  { id: 'ie_vip', category: 'infantil_estudio', name: 'Pack VIP', price: 240000, digitalQty: 20, printQty13x18: 0, printQty20x30: 1, hasFotolibro: true, imanesQty: 20, maxBackgrounds: 2 },
  // Exterior
  { id: 'ext_dig1', category: 'exterior', name: 'Pack Digital 1', price: 70000, digitalQty: 10, printQty13x18: 0, printQty20x30: 0, hasFotolibro: false, imanesQty: 0 },
  { id: 'ext_dig2', category: 'exterior', name: 'Pack Digital 2', price: 120000, digitalQty: 20, printQty13x18: 0, printQty20x30: 0, hasFotolibro: false, imanesQty: 0 },
  { id: 'ext_plata', category: 'exterior', name: 'Pack Plata', price: 80000, digitalQty: 8, printQty13x18: 8, printQty20x30: 1, hasFotolibro: false, imanesQty: 0 },
  { id: 'ext_oro', category: 'exterior', name: 'Pack Oro', price: 120000, digitalQty: 12, printQty13x18: 12, printQty20x30: 2, hasFotolibro: false, imanesQty: 0 },
  { id: 'ext_vip', category: 'exterior', name: 'Pack VIP', price: 240000, digitalQty: 25, printQty13x18: 0, printQty20x30: 2, hasFotolibro: true, imanesQty: 20 },
  // Maternidad
  { id: 'mat_est1', category: 'maternidad', name: 'Pack 1 Estudio', price: 70000, digitalQty: 10, printQty13x18: 0, printQty20x30: 0, hasFotolibro: false, imanesQty: 0 },
  { id: 'mat_est2', category: 'maternidad', name: 'Pack 2 Estudio', price: 100000, digitalQty: 15, printQty13x18: 15, printQty20x30: 1, hasFotolibro: false, imanesQty: 0 },
  { id: 'mat_ext1', category: 'maternidad', name: 'Pack 1 Exterior', price: 90000, digitalQty: 15, printQty13x18: 0, printQty20x30: 0, hasFotolibro: false, imanesQty: 0 },
  { id: 'mat_ext2', category: 'maternidad', name: 'Pack 2 Exterior', price: 160000, digitalQty: 20, printQty13x18: 0, printQty20x30: 0, hasFotolibro: true, imanesQty: 0 },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
};

export const formatSplitPrice = (price: number): string => {
  const half = Math.round(price / 2);
  return `2 pagos de ${formatPrice(half)}`;
};

export const formatPackDetails = (pack: PackDefinition): string => {
  const parts: string[] = [];
  if (pack.digitalQty > 0) parts.push(`${pack.digitalQty} digitales`);
  if (pack.printQty13x18 > 0) parts.push(`${pack.printQty13x18} impresas 13×18`);
  if (pack.printQty20x30 > 0) parts.push(`${pack.printQty20x30} impresas 20×30`);
  if (pack.hasFotolibro) parts.push('fotolibro');
  if (pack.imanesQty > 0) parts.push(`${pack.imanesQty} imanes`);
  if (parts.length === 0) return pack.name;
  if (parts.length === 1) return parts[0];
  const last = parts.pop();
  return `${parts.join(', ')} y ${last}`;
};

export type DbBackground = {
  id: string;
  name: string;
  theme: string;
  image_data: string;
};

export type GlobalSettings = {
  id: string;
  cost_13x18: number;
  cost_20x30: number;
  cost_fotolibro: number;
  cost_imanes: number;
};

export type PackConfig = {
  pack_id: string;
  price: number;
  cost: number; // total computed cost for legacy compatibility
  cost_13x18?: number;
  cost_20x30?: number;
  cost_fotolibro?: number;
  cost_imanes?: number;
  cost_otros?: number;
  inclusions?: string;
};

export const BACKGROUND_THEMES = ["personajes", "bosque", "tematicos", "clasicos", "globos", "otros"];
