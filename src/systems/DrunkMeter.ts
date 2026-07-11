import { BALANCE } from '../config/balance';

export type Stage = 'sober' | 'scooter' | 'fishing' | 'petrovna' | 'blackout';

/**
 * Шкала опьянения текущего забега: 0..100.
 */
class DrunkMeterImpl {
  private _value = 0;
  private _drinksCount = 0;

  get value(): number {
    return this._value;
  }

  get drinksCount(): number {
    return this._drinksCount;
  }

  /** @returns новое значение шкалы. */
  add(amount: number): number {
    this._value = Math.min(BALANCE.drunk.max, this._value + amount);
    this._drinksCount += 1;
    return this._value;
  }

  /** Нормированное значение 0..1. */
  get t(): number {
    return this._value / BALANCE.drunk.max;
  }

  /** Куда ведёт кнопка «ХВАТИТ, ПОШЁЛ» при текущей шкале. */
  stageForValue(): Stage {
    const v = this._value;
    const b = BALANCE.drunk;
    if (v >= b.max) return 'blackout';
    if (v === 0) return 'sober';
    if (v <= b.stage1Max) return 'scooter';
    if (v <= b.stage2Max) return 'fishing';
    return 'petrovna';
  }

  reset(): void {
    this._value = 0;
    this._drinksCount = 0;
  }
}

export const DrunkMeter = new DrunkMeterImpl();
