import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DRINKS, type Drink } from '../data/drinks';
import { STRINGS } from '../data/strings';
import { AudioManager } from '../systems/AudioManager';
import { DrunkMeter } from '../systems/DrunkMeter';
import { DrunkVisualFx } from '../systems/DrunkVisualFx';
import { MixTracker } from '../systems/MixTracker';
import { SaveManager } from '../systems/SaveManager';
import { Button } from '../ui/Button';
import { Meter } from '../ui/Meter';
import { MuteButton } from '../ui/MuteButton';
import { showToast } from '../ui/Toast';

interface BottleSlot {
  drink: Drink;
  sprite: Phaser.GameObjects.Image;
  homeX: number;
  homeY: number;
}

export class BarScene extends Phaser.Scene {
  private fx!: DrunkVisualFx;
  private meter!: Meter;
  private rodion!: Phaser.GameObjects.Image;
  private mixText!: Phaser.GameObjects.Text;
  private bottles: BottleSlot[] = [];
  private inputLocked = false;
  private over = false;

  constructor() {
    super('Bar');
  }

  create(): void {
    const { width, height } = BALANCE.view;
    this.bottles = [];
    this.inputLocked = false;
    this.over = false;

    this.add.image(width / 2, height / 2, 'bg_bar').setDisplaySize(width, height);

    this.add
      .text(width / 2, 42, STRINGS.bar.title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '22px',
        color: '#f0e6d2',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.meter = new Meter(this, width / 2, 108, width - 90, 30, STRINGS.bar.meterLabel);
    this.meter.setValue(DrunkMeter.value);

    this.mixText = this.add
      .text(width / 2, 140, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#d9a441',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.rodion = this.add.image(width * 0.32, height * 0.62, 'rodion_idle');
    this.updateRodionLook();

    // Полка с бутылками.
    const shelfY = height * 0.33;
    const step = width / (DRINKS.length + 0.4);
    DRINKS.forEach((drink, i) => {
      const x = step * (i + 0.7);
      const sprite = this.add.image(x, shelfY, drink.textureKey).setInteractive({ useHandCursor: true });
      sprite.on('pointerup', () => this.drink(this.bottles[i]));
      this.add
        .text(x, shelfY + 78, `${drink.name}\n${drink.degrees}° · +${drink.gain}${drink.gainJitter ? '±' + drink.gainJitter : ''}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#f0e6d2',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      this.bottles.push({ drink, sprite, homeX: x, homeY: shelfY });
    });

    const barman = this.add
      .text(width * 0.72, height * 0.55, STRINGS.bar.barmanIntro, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#cbbfa8',
        align: 'center',
        backgroundColor: '#1a1a1ec0',
        padding: { x: 10, y: 6 },
        wordWrap: { width: 170 },
      })
      .setOrigin(0.5);
    this.time.delayedCall(4000, () => barman.destroy());

    new Button(this, width / 2, height * 0.9, STRINGS.bar.leaveButton, () => this.leave(), {
      width: 320,
      height: 70,
      color: 0x5fbf4a,
    });

    new MuteButton(this, width - 36, 36);
    this.fx = new DrunkVisualFx(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.fx.destroy());
    this.input.once('pointerdown', () => AudioManager.ensureMusic(this));
  }

  override update(time: number, delta: number): void {
    this.fx.update(time, delta);
    // Родион покачивается тем сильнее, чем пьянее.
    this.rodion.setAngle(Math.sin(time / 400) * 6 * DrunkMeter.t);
  }

  /** Краснеет и косеет по мере опьянения. */
  private updateRodionLook(): void {
    const t = DrunkMeter.t;
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(255, 255, 255),
      new Phaser.Display.Color(255, 118, 105),
      100,
      Math.round(t * 100)
    );
    this.rodion.setTint(Phaser.Display.Color.GetColor(Math.round(c.r), Math.round(c.g), Math.round(c.b)));
  }

  private setBottlesDimmed(dimmed: boolean): void {
    this.bottles.forEach((b) => b.sprite.setAlpha(dimmed ? 0.55 : 1));
  }

  private drink(slot: BottleSlot): void {
    if (this.inputLocked || this.over) return;
    this.inputLocked = true;
    this.setBottlesDimmed(true);

    const d = slot.drink;
    const jitter = d.gainJitter > 0 ? Phaser.Math.Between(-d.gainJitter, d.gainJitter) : 0;
    const gain = d.gain + jitter;

    const prevTypes = MixTracker.typesCount;
    MixTracker.addDrink(d.type);
    const value = DrunkMeter.add(gain);

    // Бутылка летит ко рту и наклоняется.
    this.tweens.add({
      targets: slot.sprite,
      x: this.rodion.x + 46,
      y: this.rodion.y - 90,
      angle: -115,
      duration: 240,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        AudioManager.play(this, 'glug');
        this.meter.animateTo(value, BALANCE.drunk.meterTweenMs);
        this.tweens.add({
          targets: slot.sprite,
          scale: { from: 1, to: 0.92 },
          duration: 130,
          yoyo: true,
          repeat: 2,
        });
        this.time.delayedCall(BALANCE.drunk.meterTweenMs * 0.75, () => {
          AudioManager.play(this, 'gulp');
          if (Math.random() < 0.22) AudioManager.play(this, 'burp', 0.7);
          this.tweens.add({
            targets: slot.sprite,
            x: slot.homeX,
            y: slot.homeY,
            angle: 0,
            scale: 1,
            duration: 220,
            ease: 'Cubic.easeIn',
          });
          this.afterDrink(d, prevTypes, value);
        });
      },
    });
  }

  private afterDrink(d: Drink, prevTypes: number, value: number): void {
    this.updateRodionLook();
    this.tweens.add({
      targets: this.rodion,
      y: this.rodion.y - 10,
      duration: 110,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.mixText.setText(STRINGS.bar.mixWarning[MixTracker.level]);
    if (MixTracker.typesCount > prevTypes && MixTracker.typesCount >= 3) {
      if (SaveManager.unlockAchievement('yorsh')) {
        showToast(this, `${STRINGS.ending.achievementUnlocked}: Ёрш`);
      }
    }
    if (d.type === 'moonshine') {
      if (SaveManager.unlockAchievement('dads_recipe')) {
        showToast(this, `${STRINGS.ending.achievementUnlocked}: Батин рецепт`);
      } else if (Math.random() < 0.5) {
        showToast(this, STRINGS.bar.moonshineTip, '#cbbfa8');
      }
    }

    if (value >= BALANCE.drunk.max) {
      this.blackout();
    } else {
      this.inputLocked = false;
      this.setBottlesDimmed(false);
    }
  }

  /** >= 100: мгновенный гейм-овер прямо в баре. */
  private blackout(): void {
    this.over = true;
    const { width, height } = BALANCE.view;
    const black = this.add
      .rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0)
      .setDepth(970)
      .setScrollFactor(0);
    this.tweens.add({
      targets: this.rodion,
      angle: 90,
      y: this.rodion.y + 90,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => AudioManager.play(this, 'thud'),
    });
    this.tweens.add({
      targets: black,
      fillAlpha: 1,
      duration: 900,
      delay: 300,
      onComplete: () => {
        const caption = this.add
          .text(width / 2, height / 2, STRINGS.bar.blackoutTitle, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '26px',
            color: '#f0e6d2',
          })
          .setOrigin(0.5)
          .setDepth(980)
          .setAlpha(0);
        this.tweens.add({ targets: caption, alpha: 1, duration: 500 });
        this.time.delayedCall(1900, () => this.scene.start('Ending', { id: 'blackout' }));
      },
    });
  }

  private leave(): void {
    if (this.inputLocked || this.over) return;
    this.over = true;
    const stage = DrunkMeter.stageForValue();
    switch (stage) {
      case 'sober':
        this.scene.start('Ending', { id: 'sober' });
        break;
      case 'scooter':
        this.startStage('Scooter');
        break;
      case 'fishing':
        this.startStage('Fishing');
        break;
      case 'petrovna':
        this.startStage('Petrovna');
        break;
      case 'blackout':
        this.blackout();
        break;
    }
  }

  private startStage(key: string): void {
    if (this.scene.manager.getScene(key)) {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(key));
    } else {
      this.over = false;
      showToast(this, 'стадия в разработке', '#d9304f');
    }
  }
}
