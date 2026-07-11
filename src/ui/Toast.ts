import Phaser from 'phaser';
import { BALANCE } from '../config/balance';

let toastOffset = 0;

/** Всплывающая плашка (ачивки, реплики системы). */
export function showToast(scene: Phaser.Scene, text: string, color = '#f0e6d2'): void {
  const { width } = BALANCE.view;
  const y = 120 + toastOffset;
  toastOffset = (toastOffset + 52) % 156;

  const label = scene.add
    .text(width / 2, y, text, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '17px',
      color,
      align: 'center',
      backgroundColor: '#1a1a1ee0',
      padding: { x: 14, y: 8 },
      wordWrap: { width: width - 60 },
    })
    .setOrigin(0.5)
    .setDepth(960)
    .setScrollFactor(0)
    .setAlpha(0);

  scene.tweens.add({
    targets: label,
    alpha: 1,
    y: y + 8,
    duration: 200,
    yoyo: true,
    hold: 1700,
    onComplete: () => label.destroy(),
  });
}
