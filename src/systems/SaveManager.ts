import type { AchievementId } from '../data/achievements';
import type { EndingId } from '../data/endings';

interface SaveData {
  endings: EndingId[];
  achievements: AchievementId[];
  /** Сколько раз подряд слился у Петровны (для «С четвёртого класса»). */
  umriStreak: number;
  muted: boolean;
}

const KEY = 'tri-stadii-save-v1';

function emptySave(): SaveData {
  return { endings: [], achievements: [], umriStreak: 0, muted: false };
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return emptySave();
    const p = parsed as Partial<SaveData>;
    return {
      endings: Array.isArray(p.endings) ? p.endings : [],
      achievements: Array.isArray(p.achievements) ? p.achievements : [],
      umriStreak: typeof p.umriStreak === 'number' ? p.umriStreak : 0,
      muted: p.muted === true,
    };
  } catch {
    return emptySave();
  }
}

class SaveManagerImpl {
  private data: SaveData = load();

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // приватный режим / нет места — играем без сохранений
    }
  }

  isEndingUnlocked(id: EndingId): boolean {
    return this.data.endings.includes(id);
  }

  /** @returns true, если концовка открыта впервые. */
  unlockEnding(id: EndingId): boolean {
    if (this.data.endings.includes(id)) return false;
    this.data.endings.push(id);
    this.persist();
    return true;
  }

  hasAchievement(id: AchievementId): boolean {
    return this.data.achievements.includes(id);
  }

  /** @returns true, если ачивка получена впервые. */
  unlockAchievement(id: AchievementId): boolean {
    if (this.data.achievements.includes(id)) return false;
    this.data.achievements.push(id);
    this.persist();
    return true;
  }

  get umriStreak(): number {
    return this.data.umriStreak;
  }

  registerUmri(): number {
    this.data.umriStreak += 1;
    this.persist();
    return this.data.umriStreak;
  }

  resetUmriStreak(): void {
    if (this.data.umriStreak === 0) return;
    this.data.umriStreak = 0;
    this.persist();
  }

  get muted(): boolean {
    return this.data.muted;
  }

  set muted(value: boolean) {
    this.data.muted = value;
    this.persist();
  }

  resetAll(): void {
    this.data = emptySave();
    this.persist();
  }
}

/** Синглтон сохранений (localStorage). */
export const SaveManager = new SaveManagerImpl();
