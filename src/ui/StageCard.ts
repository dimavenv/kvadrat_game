import Phaser from 'phaser';
import { BALANCE } from '../config/balance';

/**
 * Титульная карточка стадии: тёмный оверлей, название, подзаголовок,
 * подсказка управления. Тап — старт (заодно жест для разблокировки звука).
 */
export function showStageCard(
  scene: Phaser.Scene,
  title: string,
  subtitle: string,
  hint: string,
  onStart: () => void
): void {
  const { width, height } = BALANCE.view;
  const parts: Phaser.GameObjects.GameObject[] = [];

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.78)
    .setDepth(940)
    .setInteractive();
  parts.push(overlay);

  parts.push(
    scene.add
      .text(width / 2, height * 0.36, title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '30px',
        color: '#f0e6d2',
        align: 'center',
        wordWrap: { width: width - 50 },
      })
      .setOrigin(0.5)
      .setDepth(941)
  );
  parts.push(
    scene.add
      .text(width / 2, height * 0.45, subtitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#cbbfa8',
        align: 'center',
        wordWrap: { width: width - 70 },
        lineSpacing: 5,
      })
      .setOrigin(0.5)
      .setDepth(941)
  );
  parts.push(
    scene.add
      .text(width / 2, height * 0.56, hint, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#d9a441',
        align: 'center',
        wordWrap: { width: width - 70 },
      })
      .setOrigin(0.5)
      .setDepth(941)
  );

  const tap = scene.add
    .text(width / 2, height * 0.7, '— тап, поехали —', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#5fbf4a',
    })
    .setOrigin(0.5)
    .setDepth(941);
  parts.push(tap);
  scene.tweens.add({ targets: tap, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });

  overlay.once('pointerup', () => {
    parts.forEach((p) => p.destroy());
    onStart();
  });
}
