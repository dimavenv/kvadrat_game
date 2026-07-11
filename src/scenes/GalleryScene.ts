import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ACHIEVEMENTS } from '../data/achievements';
import { ENDINGS } from '../data/endings';
import { STRINGS } from '../data/strings';
import { SaveManager } from '../systems/SaveManager';
import { Button } from '../ui/Button';
import { MuteButton } from '../ui/MuteButton';
import { showToast } from '../ui/Toast';

/**
 * Галерея: все концовки (закрытые — силуэт с «???») и ачивки.
 * Тап по ачивке показывает описание. Кнопка сброса с подтверждением.
 */
export class GalleryScene extends Phaser.Scene {
  private resetArmed = false;

  constructor() {
    super('Gallery');
  }

  create(): void {
    const { width, height } = BALANCE.view;
    this.resetArmed = false;
    this.cameras.main.setBackgroundColor('#16161c');

    this.add
      .text(width / 2, 36, STRINGS.gallery.title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '24px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);

    // Сетка концовок 2×4.
    const cols = 2;
    const cardW = 190;
    const cardH = 108;
    const startY = 116;
    const pitch = 126;
    ENDINGS.forEach((ending, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = width / 2 + (col - 0.5) * (cardW + 26);
      const y = startY + row * pitch;
      const unlocked = SaveManager.isEndingUnlocked(ending.id);

      const pic = this.add.image(x, y, ending.textureKey).setDisplaySize(cardW, cardH * 0.78);
      const frame = this.add
        .rectangle(x, y, cardW + 6, cardH * 0.78 + 6)
        .setStrokeStyle(3, unlocked ? (ending.isWin ? 0x5fbf4a : 0xd9304f) : 0x3a3a44);

      if (!unlocked) pic.setTint(0x0d0d11).setAlpha(0.9);
      this.add
        .text(x, y + cardH * 0.78 * 0.5 + 14, unlocked ? ending.title : STRINGS.gallery.locked, {
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '12px',
          color: unlocked ? '#f0e6d2' : '#55555f',
          align: 'center',
          wordWrap: { width: cardW },
        })
        .setOrigin(0.5, 0);
      if (unlocked) {
        frame.setInteractive({ useHandCursor: true });
        frame.on('pointerup', () => showToast(this, ending.text));
      }
    });

    // Ачивки: две колонки, тап — описание.
    const achY = startY + 4 * pitch - 6;
    this.add
      .text(width / 2, achY, STRINGS.gallery.achievementsTitle, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color: '#d9a441',
      })
      .setOrigin(0.5);

    ACHIEVEMENTS.forEach((a, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = width * (col === 0 ? 0.27 : 0.73);
      const y = achY + 30 + row * 26;
      const has = SaveManager.hasAchievement(a.id);
      const label = this.add
        .text(x, y, `${has ? '🏆' : '·'} ${has ? a.title : STRINGS.gallery.locked}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: has ? '#f0e6d2' : '#55555f',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      label.on('pointerup', () => {
        showToast(this, has ? `${a.title} — ${a.text}` : 'ачивка ещё не открыта');
      });
    });

    const resetBtn = new Button(
      this,
      width * 0.32,
      height - 52,
      STRINGS.gallery.reset,
      () => {
        if (!this.resetArmed) {
          this.resetArmed = true;
          resetBtn.setText(STRINGS.gallery.resetConfirm);
          this.time.delayedCall(2500, () => {
            this.resetArmed = false;
            resetBtn.setText(STRINGS.gallery.reset);
          });
          return;
        }
        SaveManager.resetAll();
        this.scene.restart();
      },
      { width: 220, height: 54, fontSize: 15, color: 0xd9304f, textColor: '#f0e6d2' }
    );

    new Button(this, width * 0.78, height - 52, STRINGS.gallery.back, () => this.scene.start('Menu'), {
      width: 160,
      height: 54,
      fontSize: 17,
      color: 0x8f9299,
    });

    new MuteButton(this, width - 36, 36);
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
