import Phaser from 'phaser';
import { AUDIO_ASSETS, IMAGE_ASSETS, type ImageAsset } from '../config/assets';
import { AudioManager } from '../systems/AudioManager';

/**
 * Грузит все ассеты из реестра. Отсутствующие картинки заменяет
 * цветными плейсхолдерами с подписью ключа, отсутствующий звук молча скипает.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 260, 22, 0x1a1a1e).setStrokeStyle(3, 0x555560);
    const bar = this.add.rectangle(width / 2 - 126, height / 2, 1, 14, 0xd9a441).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => {
      bar.width = Math.max(1, 252 * p);
    });
    this.load.on('complete', () => {
      barBg.destroy();
      bar.destroy();
    });
    // Ошибки загрузки (нет файла) — штатная ситуация до генерации графики.
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.info(`[assets] нет файла: ${file.src} → плейсхолдер/тишина`);
    });

    for (const a of IMAGE_ASSETS) this.load.image(a.key, a.path);
    for (const a of AUDIO_ASSETS) this.load.audio(a.key, a.path);
  }

  create(): void {
    for (const a of IMAGE_ASSETS) this.ensurePlaceholder(a);
    AudioManager.applyMuteState(this);
    this.scene.start('Menu');
  }

  /** Canvas-текстура: цветной прямоугольник + подпись ключа. */
  private ensurePlaceholder(a: ImageAsset): void {
    if (this.textures.exists(a.key)) return;
    const canvas = this.textures.createCanvas(a.key, a.width, a.height);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const css = `#${a.color.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, a.width, a.height);

    // Полосы на высоких текстурах — чтобы скролл фона было видно.
    if (a.height >= 400) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < a.height; y += 64) ctx.fillRect(0, y, a.width, 32);
    }

    const border = Math.max(2, Math.round(Math.min(a.width, a.height) * 0.04));
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, a.width - border, a.height - border);

    const fontSize = Math.max(9, Math.min(18, Math.floor((a.width / a.key.length) * 1.6)));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillText(a.key, a.width / 2, a.height / 2);

    canvas.refresh();
  }
}
