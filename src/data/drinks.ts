export type DrinkType = 'beer' | 'wine' | 'liqueur' | 'vodka' | 'moonshine';

export interface Drink {
  type: DrinkType;
  /** Ключ текстуры бутылки. */
  textureKey: string;
  name: string;
  degrees: number;
  /** Базовый прирост шкалы. */
  gain: number;
  /** Случайный разброс прироста (±). */
  gainJitter: number;
}

export const DRINKS: readonly Drink[] = [
  { type: 'beer', textureKey: 'bottle_beer', name: 'Пиво', degrees: 5, gain: 8, gainJitter: 0 },
  { type: 'wine', textureKey: 'bottle_wine', name: 'Вино', degrees: 12, gain: 14, gainJitter: 0 },
  { type: 'liqueur', textureKey: 'bottle_liqueur', name: 'Настойка', degrees: 20, gain: 20, gainJitter: 0 },
  { type: 'vodka', textureKey: 'bottle_vodka', name: 'Водка', degrees: 40, gain: 30, gainJitter: 0 },
  { type: 'moonshine', textureKey: 'bottle_moonshine', name: 'Батин самогон', degrees: 60, gain: 40, gainJitter: 10 },
] as const;
