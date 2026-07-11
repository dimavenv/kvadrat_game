import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { achievementById, type AchievementId } from '../data/achievements';
import { endingById, type EndingId } from '../data/endings';
import { STRINGS } from '../data/strings';
import { DrunkMeter } from '../systems/DrunkMeter';
import { MixTracker } from '../systems/MixTracker';
import { SaveManager } from '../systems/SaveManager';
import { Button } from '../ui/Button';
import { MuteButton } from '../ui/MuteButton';

export interface EndingSceneData {
  id: EndingId;
  /** Ачивки, открытые сценой-источником (для показа). */
  newAchievements?: AchievementId[];
}

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create(data: EndingSceneData): void {
    const { width, height } = BALANCE.view;
    const ending = endingById(data.id);

    const isNew = SaveManager.unlockEnding(ending.id);
    const newAchievements = [...(data.newAchievements ?? []), ...this.processMeta(data.id)];

    this.cameras.main.setBackgroundColor('#101014');

    if (isNew) {
      this.add
        .text(width / 2, height * 0.08, STRINGS.ending.unlocked, {
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '16px',
          color: '#d9a441',
        })
        .setOrigin(0.5);
    }

    const pic = this.add.image(width / 2, height * 0.3, ending.textureKey);
    pic.setScale(Math.min((width - 60) / pic.width, 1));
    this.tweens.add({
      targets: pic,
      scale: pic.scale * 1.03,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(width / 2, height * 0.52, ending.title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '34px',
        color: ending.isWin ? '#5fbf4a' : '#d9304f',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
        wordWrap: { width: width - 50 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.62, ending.text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#f0e6d2',
        align: 'center',
        wordWrap: { width: width - 70 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    // Плашки новых ачивок.
    newAchievements.forEach((id, i) => {
      const a = achievementById(id);
      const label = this.add
        .text(width / 2, height * 0.72 + i * 40, `🏆 ${STRINGS.ending.achievementUnlocked}: ${a.title}`, {
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '15px',
          color: '#d9a441',
          backgroundColor: '#1a1a1ee0',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setAlpha(0);
      this.tweens.add({ targets: label, alpha: 1, delay: 400 + i * 300, duration: 300 });
    });

    new Button(this, width / 2 - 85, height * 0.9, STRINGS.ending.retry, () => this.retry(), {
      width: 150,
      height: 60,
      fontSize: 19,
    });
    new Button(this, width / 2 + 85, height * 0.9, STRINGS.ending.toMenu, () => this.scene.start('Menu'), {
      width: 150,
      height: 60,
      fontSize: 19,
      color: 0x8f9299,
    });

    new MuteButton(this, width - 36, 36);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  /** Ачивки и счётчики, завязанные на сам факт концовки. */
  private processMeta(id: EndingId): AchievementId[] {
    const unlocked: AchievementId[] = [];
    const tryUnlock = (a: AchievementId): void => {
      if (SaveManager.unlockAchievement(a)) unlocked.push(a);
    };

    switch (id) {
      case 'blackout':
        tryUnlock('blackout_start');
        break;
      case 'sober':
        tryUnlock('teetotaler');
        break;
      case 'kiss':
        tryUnlock('kiss');
        SaveManager.resetUmriStreak();
        break;
      case 'umri': {
        tryUnlock('umri_first');
        const streak = SaveManager.registerUmri();
        if (streak >= 10) tryUnlock('since_4th_grade');
        break;
      }
      default:
        break;
    }
    return unlocked;
  }

  private retry(): void {
    DrunkMeter.reset();
    MixTracker.reset();
    this.scene.start('Bar');
  }
}
