/** Quick-add presets for common shipments — clicking one appends an item row. */

export interface ItemPreset {
  label: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
}

export const ITEM_PRESETS: readonly ItemPreset[] = [
  { label: "Small box", lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 5 },
  { label: "Large box", lengthCm: 60, widthCm: 40, heightCm: 40, weightKg: 15 },
  { label: "Suitcase", lengthCm: 75, widthCm: 50, heightCm: 30, weightKg: 20 },
  { label: "TV box", lengthCm: 110, widthCm: 20, heightCm: 75, weightKg: 15 },
  { label: "Euro pallet", lengthCm: 120, widthCm: 80, heightCm: 150, weightKg: 300 },
  { label: "Sofa", lengthCm: 200, widthCm: 90, heightCm: 90, weightKg: 45 },
];
