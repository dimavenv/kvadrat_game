import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  color?: number;
  textColor?: string;
}

/**
 * Кнопка: скруглённый прямоугольник + текст. Тач-френдли.
 */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private btnW: number;
  private btnH: number;
  private color: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    opts: ButtonOptions = {}
  ) {
    super(scene, x, y);
    this.btnW = opts.width ?? 280;
    this.btnH = opts.height ?? 64;
    this.color = opts.color ?? 0xd9a441;

    this.bg = scene.add.graphics();
    this.drawBg(this.color);
    this.add(this.bg);

    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: `${opts.fontSize ?? 24}px`,
        color: opts.textColor ?? '#1a1a1e',
        align: 'center',
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.setSize(this.btnW, this.btnH);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.setScale(0.94));
    this.on('pointerout', () => this.setScale(1));
    this.on('pointerup', () => {
      this.setScale(1);
      AudioManager.play(scene, 'gulp', 0.2);
      onClick();
    });

    scene.add.existing(this);
  }

  private drawBg(color: number): void {
    const w = this.btnW;
    const h = this.btnH;
    this.bg.clear();
    this.bg.fillStyle(0x000000, 1);
    this.bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 14);
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    this.bg.lineStyle(4, 0x000000, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setEnabled(enabled: boolean): this {
    if (enabled) {
      this.setInteractive({ useHandCursor: true });
      this.setAlpha(1);
    } else {
      this.disableInteractive();
      this.setAlpha(0.5);
    }
    return this;
  }
}
