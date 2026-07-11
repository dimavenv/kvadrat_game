import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { STRINGS } from '../data/strings';
import { AudioManager } from '../systems/AudioManager';
import { DrunkMeter } from '../systems/DrunkMeter';
import { MixTracker } from '../systems/MixTracker';
import { Button } from '../ui/Button';
import { MuteButton } from '../ui/MuteButton';
import { sizeToContract } from '../ui/sprites';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const { width, height } = BALANCE.view;
    this.add.image(width / 2, height / 2, 'bg_menu').setDisplaySize(width, height);

    const title = this.add
      .text(width / 2, height * 0.18, STRINGS.gameTitle, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '58px',
        color: '#f0e6d2',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: title,
      angle: { from: -1.5, to: 1.5 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(width / 2, height * 0.25, STRINGS.gameSubtitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#cbbfa8',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    sizeToContract(this.add.image(width / 2, height * 0.47, 'rodion_idle'), 'rodion_idle', 0.9);

    new Button(this, width / 2, height * 0.68, STRINGS.menu.play, () => this.startRun());
    new Button(
      this,
      width / 2,
      height * 0.78,
      STRINGS.menu.gallery,
      () => {
        if (this.scene.manager.getScene('Gallery')) this.scene.start('Gallery');
      },
      { color: 0x8f9299 }
    );

    this.add
      .text(width / 2, height * 0.87, STRINGS.menu.credits, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#9a8f7a',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.95, STRINGS.menu.hint, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#77705f',
      })
      .setOrigin(0.5);

    new MuteButton(this, width - 36, 36);

    // Музыка стартует по первому жесту (политика браузеров).
    this.input.once('pointerdown', () => AudioManager.ensureMusic(this));
  }

  private startRun(): void {
    DrunkMeter.reset();
    MixTracker.reset();
    if (this.scene.manager.getScene('Bar')) {
      this.scene.start('Bar');
    }
  }
}
