import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DrunkMeter } from './DrunkMeter';
import { MixTracker } from './MixTracker';

/**
 * Косметика опьянения: камера качается пропорционально drunk,
 * а при ёрше поверх экрана плывут цвета. Механических штрафов нет.
 * Сцена обязана звать update(time, delta) и destroy() при выходе.
 */
export class DrunkVisualFx {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle;
  private hue = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = BALANCE.view;
    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width * 1.6, height * 1.6, 0xff00ff, 0)
      .setDepth(900)
      .setBlendMode(Phaser.BlendModes.OVERLAY)
      .setScrollFactor(0);
  }

  update(timeMs: number, deltaMs: number): void {
    const fx = BALANCE.fx;
    const t = timeMs / 1000;
    const drunkT = DrunkMeter.t;
    const cam = this.scene.cameras.main;

    // Качание камеры: две несинхронные синусоиды.
    const sway = Math.sin(t * fx.swaySpeed) * 0.6 + Math.sin(t * fx.swaySpeed * 1.7 + 1.3) * 0.4;
    cam.setRotation(sway * fx.swayRotationMax * drunkT);
    cam.setZoom(1 + Math.sin(t * fx.swaySpeed * 0.8) * fx.swayZoomMax * drunkT);

    // Ёрш: цветовой шифт, тем сильнее, чем больше типов смешано.
    const level = MixTracker.level;
    const alpha = fx.mixOverlayAlpha[level];
    this.overlay.setAlpha(alpha);
    if (level > 0) {
      this.hue = (this.hue + (deltaMs / 1000) * fx.mixHueSpeed[level]) % 1;
      const color = Phaser.Display.Color.HSVToRGB(this.hue, 0.85, 1) as Phaser.Display.Color;
      this.overlay.setFillStyle(color.color, alpha);
    }
  }

  destroy(): void {
    const cam = this.scene.cameras.main;
    cam.setRotation(0);
    cam.setZoom(1);
    this.overlay.destroy();
  }
}
