import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';

/** Маленькая кнопка mute в углу. Есть на каждой сцене с UI. */
export class MuteButton extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#f0e6d2',
    });
    this.setOrigin(0.5).setDepth(950).setScrollFactor(0);
    this.refresh(SaveManager.muted);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerup', () => {
      const muted = AudioManager.toggleMute(scene);
      this.refresh(muted);
    });
    scene.add.existing(this);
  }

  private refresh(muted: boolean): void {
    this.setText(muted ? '🔇' : '🔊');
    this.setAlpha(muted ? 0.55 : 1);
  }
}
