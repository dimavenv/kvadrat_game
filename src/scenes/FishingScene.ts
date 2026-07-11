import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import type { AchievementId } from '../data/achievements';
import { STRINGS } from '../data/strings';
import { AudioManager } from '../systems/AudioManager';
import { DrunkMeter } from '../systems/DrunkMeter';
import { DrunkVisualFx } from '../systems/DrunkVisualFx';
import { MixTracker } from '../systems/MixTracker';
import { SaveManager } from '../systems/SaveManager';
import { MuteButton } from '../ui/MuteButton';
import { showStageCard } from '../ui/StageCard';
import { showToast } from '../ui/Toast';

type FishingState = 'idle' | 'cast' | 'wait' | 'strike' | 'reel' | 'done';

type CatchKind = 'tolstolobik' | 'boot' | 'rotan' | 'scooter' | 'bottle';

const JUNK: readonly CatchKind[] = ['boot', 'rotan', 'scooter', 'bottle'] as const;

/**
 * Стадия 2: рыбалка на озере Круглом. Три фазы в цикле:
 * заброс (полоска силы) → клёв (тап в окно) → вываживание (Stardew-бар).
 * Цель: 3 толстолобика за 3 минуты.
 */
export class FishingScene extends Phaser.Scene {
  private fx!: DrunkVisualFx;
  private state: FishingState = 'idle';
  private timeLeft = 0;
  private fishCaught = 0;
  private newAchievements: AchievementId[] = [];

  private rodion!: Phaser.GameObjects.Image;
  private ded!: Phaser.GameObjects.Image;
  private bobber!: Phaser.GameObjects.Image;
  private timerText!: Phaser.GameObjects.Text;
  private fishText!: Phaser.GameObjects.Text;
  private captionText!: Phaser.GameObjects.Text;

  // Заброс.
  private castUi?: Phaser.GameObjects.Container;
  private castMarker!: Phaser.GameObjects.Rectangle;
  private castT = 0;
  private castDir = 1;
  private greenFrom = 0;
  private greenTo = 0;
  private castGood = false;

  // Клёв.
  private strikeDeadline = 0;
  private falseBiteUntil = 0;
  private waitEvents: Phaser.Time.TimerEvent[] = [];

  // Вываживание.
  private reelUi?: Phaser.GameObjects.Container;
  private reelFish!: Phaser.GameObjects.Image;
  private reelZone!: Phaser.GameObjects.Rectangle;
  private reelProgressFill!: Phaser.GameObjects.Rectangle;
  private reelLineFill!: Phaser.GameObjects.Rectangle;
  private fishPos = 0.5;
  private fishTarget = 0.5;
  private zonePos = 0.5;
  private zoneVel = 0;
  private reelProgress = 0.25;
  private reelLine = 1;
  private fishMoveEvent?: Phaser.Time.TimerEvent;
  private spaceKey?: Phaser.Input.Keyboard.Key;

  private readonly reelBarH = 340;
  private readonly reelBarY = BALANCE.view.height * 0.42;
  private readonly reelBarX = BALANCE.view.width - 64;

  constructor() {
    super('Fishing');
  }

  create(): void {
    const { width, height } = BALANCE.view;
    this.state = 'idle';
    this.timeLeft = BALANCE.fishing.totalSeconds;
    this.fishCaught = 0;
    this.newAchievements = [];

    this.add.image(width / 2, height / 2, 'bg_lake').setDisplaySize(width, height);
    this.ded = this.add.image(width * 0.78, height * 0.2, 'ded').setScale(0.8);
    this.rodion = this.add.image(width * 0.24, height * 0.82, 'rodion_fishing');

    this.bobber = this.add.image(width * 0.55, height * 0.6, 'bobber').setVisible(false);

    this.timerText = this.add
      .text(width - 24, 30, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '22px',
        color: '#f0e6d2',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(1, 0.5)
      .setDepth(920);
    this.fishText = this.add
      .text(24, 30, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '20px',
        color: '#f0e6d2',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0, 0.5)
      .setDepth(920);
    this.updateHud();

    this.add
      .text(width / 2, 58, STRINGS.fishing.location, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#cbbfa8',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(920);

    this.captionText = this.add
      .text(width / 2, height * 0.33, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '24px',
        color: '#f0e6d2',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(925);

    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on('pointerdown', () => this.onTap());
    this.spaceKey?.on('down', () => this.onTap());

    new MuteButton(this, width - 36, 76);
    this.fx = new DrunkVisualFx(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.fx.destroy();
      this.clearWaitEvents();
      this.fishMoveEvent?.remove();
    });

    this.cameras.main.fadeIn(350, 0, 0, 0);
    showStageCard(this, STRINGS.stages.stage2, STRINGS.stages.stage2Sub, STRINGS.fishing.goal, () => {
      AudioManager.ensureMusic(this);
      this.scheduleDedComment();
      this.beginCast();
    });
  }

  private updateHud(): void {
    this.fishText.setText(`🐟 ${this.fishCaught}/${BALANCE.fishing.targetFish}`);
    const m = Math.floor(Math.max(0, this.timeLeft) / 60);
    const s = Math.floor(Math.max(0, this.timeLeft) % 60);
    this.timerText.setText(`${m}:${String(s).padStart(2, '0')}`);
  }

  private setCaption(text: string, color = '#f0e6d2'): void {
    this.captionText.setText(text).setColor(color);
  }

  // ─── Фаза 1: заброс ───────────────────────────────────────────────

  private beginCast(): void {
    if (this.state === 'done') return;
    const { width, height } = BALANCE.view;
    this.state = 'cast';
    this.bobber.setVisible(false);
    this.setCaption(STRINGS.fishing.castHint);

    const barW = 300;
    const barH = 26;
    const zoneW = BALANCE.fishing.castGreenZone;
    this.greenFrom = Phaser.Math.FloatBetween(0.5, 1 - zoneW);
    this.greenTo = this.greenFrom + zoneW;
    this.castT = 0;
    this.castDir = 1;

    const c = this.add.container(width / 2, height * 0.9).setDepth(922);
    const bg = this.add.rectangle(0, 0, barW, barH, 0x1a1a1e).setStrokeStyle(3, 0x000000);
    const green = this.add
      .rectangle(-barW / 2 + this.greenFrom * barW, 0, (this.greenTo - this.greenFrom) * barW, barH - 6, 0x5fbf4a)
      .setOrigin(0, 0.5);
    this.castMarker = this.add.rectangle(-barW / 2, 0, 6, barH + 10, 0xf0e6d2);
    c.add([bg, green, this.castMarker]);
    this.castUi = c;
  }

  private finishCast(): void {
    const { width, height } = BALANCE.view;
    this.castGood = this.castT >= this.greenFrom && this.castT <= this.greenTo;
    this.castUi?.destroy();
    this.castUi = undefined;
    this.state = 'idle';
    this.setCaption('');

    const targetY = this.castGood ? height * 0.5 : height * 0.68;
    const targetX = width * (this.castGood ? 0.6 : 0.42) + Phaser.Math.Between(-40, 40);
    this.bobber.setPosition(this.rodion.x + 40, this.rodion.y - 120).setVisible(true);
    AudioManager.play(this, 'reel', 0.6);
    this.tweens.add({
      targets: this.bobber,
      x: targetX,
      y: targetY,
      duration: this.castGood ? 700 : 450,
      ease: 'Quad.easeOut',
      onComplete: () => {
        AudioManager.play(this, 'splash');
        this.beginWait();
      },
    });
  }

  // ─── Фаза 2: клёв ─────────────────────────────────────────────────

  private beginWait(): void {
    if (this.state === 'done') return;
    const f = BALANCE.fishing;
    this.state = 'wait';
    this.setCaption(STRINGS.fishing.biteHint, '#cbbfa8');

    // Поплавок мерно качается.
    this.tweens.add({
      targets: this.bobber,
      y: this.bobber.y + 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const waitSec = Phaser.Math.FloatBetween(f.biteWaitMin, f.biteWaitMax);

    // Ложные поклёвки-галлюцинации при высоком drunk.
    const falseChance = f.falseBiteChanceMax * DrunkMeter.t;
    this.clearWaitEvents();
    for (let i = 1; i <= 2; i++) {
      if (Math.random() < falseChance) {
        const at = waitSec * 1000 * (i / 3);
        this.waitEvents.push(
          this.time.delayedCall(at, () => {
            if (this.state !== 'wait') return;
            this.twitchBobber(6);
            this.falseBiteUntil = this.time.now + 700;
          })
        );
      }
    }

    this.waitEvents.push(this.time.delayedCall(waitSec * 1000, () => this.beginStrike()));
  }

  private clearWaitEvents(): void {
    this.waitEvents.forEach((e) => e.remove());
    this.waitEvents = [];
  }

  private twitchBobber(depth: number): void {
    this.tweens.add({
      targets: this.bobber,
      y: this.bobber.y + depth,
      duration: 90,
      yoyo: true,
      repeat: 2,
    });
    AudioManager.play(this, 'splash', 0.4);
  }

  private beginStrike(): void {
    if (this.state !== 'wait' || (this.state as FishingState) === 'done') return;
    const f = BALANCE.fishing;
    this.state = 'strike';
    const windowMs = Phaser.Math.Linear(f.biteWindowMs, f.biteWindowDrunkMs, DrunkMeter.t);
    this.strikeDeadline = this.time.now + windowMs;
    this.twitchBobber(14);
    this.setCaption(STRINGS.fishing.strikeHint, '#d9304f');

    this.time.delayedCall(windowMs, () => {
      if (this.state !== 'strike') return;
      // Проспал окно.
      this.state = 'idle';
      this.setCaption(STRINGS.fishing.escaped, '#cbbfa8');
      this.tweens.killTweensOf(this.bobber);
      this.time.delayedCall(900, () => this.beginCast());
    });
  }

  // ─── Фаза 3: вываживание ─────────────────────────────────────────

  private beginReel(): void {
    this.state = 'reel';
    this.tweens.killTweensOf(this.bobber);
    this.bobber.setVisible(false);
    this.setCaption(STRINGS.fishing.reelHint, '#f0e6d2');
    AudioManager.play(this, 'reel');

    const f = BALANCE.fishing;
    const barW = 46;
    const h = this.reelBarH;
    this.fishPos = 0.5;
    this.fishTarget = Phaser.Math.FloatBetween(0.15, 0.85);
    this.zonePos = 0.5;
    this.zoneVel = 0;
    this.reelProgress = 0.25;
    this.reelLine = 1;

    const c = this.add.container(this.reelBarX, this.reelBarY).setDepth(922);
    const bg = this.add.rectangle(0, 0, barW, h, 0x14303c).setStrokeStyle(4, 0x000000);
    this.reelZone = this.add.rectangle(0, 0, barW - 8, h * f.reelPlayerZone, 0x5fbf4a, 0.75);
    this.reelFish = this.add.image(0, 0, 'catch_tolstolobik').setScale(0.45);

    // Слева от бара: прогресс подъёма и «леска».
    const progressBg = this.add.rectangle(-barW + 6, 0, 12, h, 0x1a1a1e).setStrokeStyle(2, 0x000000);
    this.reelProgressFill = this.add.rectangle(-barW + 6, h / 2, 8, 1, 0xd9a441).setOrigin(0.5, 1);
    const lineBg = this.add.rectangle(-barW - 12, 0, 8, h, 0x1a1a1e).setStrokeStyle(2, 0x000000);
    this.reelLineFill = this.add.rectangle(-barW - 12, h / 2, 5, h, 0x7fa8b8).setOrigin(0.5, 1);

    c.add([bg, this.reelZone, this.reelFish, progressBg, this.reelProgressFill, lineBg, this.reelLineFill]);
    this.reelUi = c;

    this.fishMoveEvent = this.time.addEvent({
      delay: Phaser.Math.Between(500, 1100),
      loop: true,
      callback: () => {
        this.fishTarget = Phaser.Math.FloatBetween(0.08, 0.92);
      },
    });
  }

  private updateReel(delta: number): void {
    const f = BALANCE.fishing;
    const dt = delta / 1000;
    const h = this.reelBarH;

    // Рыба блуждает.
    this.fishPos = Phaser.Math.Linear(this.fishPos, this.fishTarget, 1 - Math.pow(0.25, dt));
    this.reelFish.y = (this.fishPos - 0.5) * h;

    // Зона игрока: удержание тянет вверх, отпускание — вниз.
    const held = this.input.activePointer.isDown || this.spaceKey?.isDown === true;
    const halfZone = f.reelPlayerZone / 2;
    this.zoneVel += ((held ? -f.reelLift : f.reelGravity) / h) * dt;
    this.zoneVel = Phaser.Math.Clamp(this.zoneVel, -1.6, 1.6);
    this.zonePos += this.zoneVel * dt;
    if (this.zonePos < halfZone) {
      this.zonePos = halfZone;
      this.zoneVel = 0;
    }
    if (this.zonePos > 1 - halfZone) {
      this.zonePos = 1 - halfZone;
      this.zoneVel = 0;
    }
    this.reelZone.y = (this.zonePos - 0.5) * h;

    // Захват: центр рыбы внутри зоны.
    const captured = Math.abs(this.fishPos - this.zonePos) <= halfZone;
    if (captured) {
      this.reelProgress += f.reelProgressGain * dt;
      this.reelLine = Math.min(1, this.reelLine + f.reelLineRegen * dt);
      this.reelZone.setFillStyle(0x5fbf4a, 0.75);
    } else {
      this.reelLine -= f.reelLineDrain * dt;
      this.reelZone.setFillStyle(0xd9304f, 0.55);
    }

    this.reelProgressFill.height = Math.max(1, h * Phaser.Math.Clamp(this.reelProgress, 0, 1));
    this.reelLineFill.height = Math.max(1, h * Phaser.Math.Clamp(this.reelLine, 0, 1));

    if (this.reelProgress >= 1) this.finishReel(true);
    else if (this.reelLine <= 0) this.finishReel(false);
  }

  private finishReel(success: boolean): void {
    this.state = 'idle';
    this.reelUi?.destroy();
    this.reelUi = undefined;
    this.fishMoveEvent?.remove();

    if (!success) {
      this.setCaption(STRINGS.fishing.escaped, '#d9304f');
      this.time.delayedCall(1000, () => this.beginCast());
      return;
    }
    this.landCatch(this.rollCatch());
  }

  private rollCatch(): CatchKind {
    const f = BALANCE.fishing;
    const chance = this.castGood ? f.fishChanceGood : f.fishChanceBad;
    if (Math.random() < chance) return 'tolstolobik';
    const junkPool = JUNK.filter((k) => k !== 'bottle' || MixTracker.typesCount > 0);
    return Phaser.Utils.Array.GetRandom([...junkPool]);
  }

  private landCatch(kind: CatchKind): void {
    const { width, height } = BALANCE.view;
    AudioManager.play(this, 'splash');

    const sprite = this.add
      .image(this.bobber.x, this.bobber.y + 30, `catch_${kind}`)
      .setDepth(923)
      .setScale(0.2)
      .setAlpha(0);
    this.tweens.add({
      targets: sprite,
      x: width / 2,
      y: height * 0.45,
      scale: 1.15,
      alpha: 1,
      angle: kind === 'tolstolobik' ? 0 : Phaser.Math.Between(-25, 25),
      duration: 550,
      ease: 'Back.easeOut',
    });

    this.setCaption(`${STRINGS.fishing.caught} ${STRINGS.fishing.catchNames[kind]}`, kind === 'tolstolobik' ? '#5fbf4a' : '#cbbfa8');

    if (kind === 'tolstolobik') {
      this.fishCaught += 1;
      this.updateHud();
    } else if (kind === 'scooter' && SaveManager.unlockAchievement('drowned_scooter')) {
      this.newAchievements.push('drowned_scooter');
      showToast(this, `${STRINGS.ending.achievementUnlocked}: Утопил самокат`);
    }

    this.time.delayedCall(1400, () => {
      this.tweens.add({ targets: sprite, alpha: 0, duration: 250, onComplete: () => sprite.destroy() });
      if (this.fishCaught >= BALANCE.fishing.targetFish) this.win();
      else this.beginCast();
    });
  }

  // ─── Общее ────────────────────────────────────────────────────────

  private onTap(): void {
    switch (this.state) {
      case 'cast':
        this.finishCast();
        break;
      case 'strike':
        if (this.time.now <= this.strikeDeadline) this.beginReel();
        break;
      case 'wait':
        if (this.time.now <= this.falseBiteUntil) {
          this.falseBiteUntil = 0;
          showToast(this, STRINGS.fishing.falseBite, '#cbbfa8');
        }
        break;
      default:
        break;
    }
  }

  private scheduleDedComment(): void {
    if (this.state === 'done') return;
    const f = BALANCE.fishing;
    this.time.delayedCall(Phaser.Math.Between(f.dedCommentMin * 1000, f.dedCommentMax * 1000), () => {
      if (this.state === 'done') return;
      const line = Phaser.Utils.Array.GetRandom([...STRINGS.fishing.dedComments]);
      const bubble = this.add
        .text(this.ded.x - 20, this.ded.y - 70, line, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: '#1a1a1e',
          backgroundColor: '#f0e6d2',
          padding: { x: 10, y: 6 },
          wordWrap: { width: 200 },
          align: 'center',
        })
        .setOrigin(0.5, 1)
        .setDepth(924);
      this.time.delayedCall(3200, () => bubble.destroy());
      this.scheduleDedComment();
    });
  }

  override update(time: number, delta: number): void {
    this.fx.update(time, delta);
    if (this.state === 'done') return;

    // Родион слегка ведёт.
    this.rodion.setAngle(Math.sin(time / 500) * 5 * DrunkMeter.t);

    // Таймер тикает во всех фазах после старта.
    if (this.state !== 'idle' || this.timeLeft < BALANCE.fishing.totalSeconds) {
      this.timeLeft -= delta / 1000;
      this.updateHud();
      if (this.timeLeft <= 0) {
        this.fail();
        return;
      }
    }

    if (this.state === 'cast' && this.castUi) {
      const barW = 300;
      this.castT += this.castDir * BALANCE.fishing.castBarSpeed * (delta / 1000);
      if (this.castT >= 1) {
        this.castT = 1;
        this.castDir = -1;
      } else if (this.castT <= 0) {
        this.castT = 0;
        this.castDir = 1;
      }
      this.castMarker.x = -barW / 2 + this.castT * barW;
    }

    if (this.state === 'reel') this.updateReel(delta);
  }

  private win(): void {
    this.state = 'done';
    if (SaveManager.unlockAchievement('square_circle')) this.newAchievements.push('square_circle');
    this.time.delayedCall(600, () => {
      this.scene.start('Ending', { id: 'fishing_win', newAchievements: this.newAchievements });
    });
  }

  private fail(): void {
    this.state = 'done';
    this.reelUi?.destroy();
    this.castUi?.destroy();
    this.clearWaitEvents();
    this.setCaption('время вышло…', '#d9304f');
    this.time.delayedCall(1400, () => {
      this.scene.start('Ending', { id: 'fishing_boot', newAchievements: this.newAchievements });
    });
  }
}
