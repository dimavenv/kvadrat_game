import { mixLevelFor, type MixLevel } from '../config/balance';
import type { DrinkType } from '../data/drinks';

/**
 * Следит, какие ТИПЫ напитков смешаны за забег («ёрш»).
 * Штрафов нет — только косметический эффект, уровень 0..3.
 */
class MixTrackerImpl {
  private types = new Set<DrinkType>();

  addDrink(type: DrinkType): void {
    this.types.add(type);
  }

  hasDrunk(type: DrinkType): boolean {
    return this.types.has(type);
  }

  get typesCount(): number {
    return this.types.size;
  }

  /** Один из типов, что пил игрок (для бутылки-пасхалки на рыбалке). */
  randomDrunkType(): DrinkType | undefined {
    const arr = [...this.types];
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  get level(): MixLevel {
    return mixLevelFor(this.types.size);
  }

  reset(): void {
    this.types.clear();
  }
}

export const MixTracker = new MixTrackerImpl();
