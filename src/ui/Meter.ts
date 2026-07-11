import Phaser from 'phaser';
import { BALANCE } from '../config/balance';

/**
 * Горизонтальная шкала 0..100 с анимированным заполнением.
 */
export class Meter extends Phaser.GameObjects.Container {
  private fill: Phaser.GameObjects.Rectangle;
  private valueText: Phaser.GameObjects.Text;
  private meterW: number;
  private shown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, label: string) {
    super(scene, x, y);
    this.meterW = width;

    const frame = scene.add.graphics();
    frame.fillStyle(0x1a1a1e, 1);
    frame.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    frame.lineStyle(4, 0x000000, 1);
    frame.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    this.add(frame);

    this.fill = scene.add
      .rectangle(-width / 2 + 4, 0, 1, height - 8, 0x5fbf4a)
      .setOrigin(0, 0.5);
    this.add(this.fill);

    const labelText = scene.add
      .text(0, -height / 2 - 14, label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '15px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);
    this.add(labelText);

    this.valueText = scene.add
      .text(0, 0, '0', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(1, 1, '#000000', 2);
    this.add(this.valueText);

    scene.add.existing(this);
  }

  private colorFor(v: number): number {
    if (v >= BALANCE.drunk.max) return 0x111111;
    if (v > BALANCE.drunk.stage2Max) return 0xd9304f;
    if (v > BALANCE.drunk.stage1Max) return 0xd9a441;
    return 0x5fbf4a;
  }

  /** Анимированно показать значение 0..100. */
  animateTo(value: number, durationMs: number): void {
    this.scene.tweens.addCounter({
      from: this.shown,
      to: value,
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => this.render(tw.getValue() ?? value),
      onComplete: () => this.render(value),
    });
    this.shown = value;
  }

  setValue(value: number): void {
    this.shown = value;
    this.render(value);
  }

  private render(v: number): void {
    const frac = Phaser.Math.Clamp(v / BALANCE.drunk.max, 0, 1);
    this.fill.width = Math.max(1, (this.meterW - 8) * frac);
    this.fill.fillColor = this.colorFor(v);
    this.valueText.setText(String(Math.round(v)));
  }
}
