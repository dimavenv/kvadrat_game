import Phaser from 'phaser';

/**
 * Окно визуальной новеллы: имя, реплика, до трёх вариантов ответа.
 * updateSway() заставляет текст «плыть» при опьянении.
 */
export class DialogueBox extends Phaser.GameObjects.Container {
  private nameText: Phaser.GameObjects.Text;
  private lineText: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private boxWidth: number;
  private baseLineY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.boxWidth = width;

    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a1e, 0.92);
    bg.fillRoundedRect(-width / 2, 0, width, 130, 12);
    bg.lineStyle(4, 0x000000, 1);
    bg.strokeRoundedRect(-width / 2, 0, width, 130, 12);
    this.add(bg);

    this.nameText = scene.add.text(-width / 2 + 16, -14, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#d9a441',
      backgroundColor: '#1a1a1e',
      padding: { x: 10, y: 4 },
    });
    this.add(this.nameText);

    this.baseLineY = 18;
    this.lineText = scene.add.text(-width / 2 + 16, this.baseLineY, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#f0e6d2',
      wordWrap: { width: width - 32 },
      lineSpacing: 5,
    });
    this.add(this.lineText);

    scene.add.existing(this);
    this.setDepth(930);
  }

  showLine(name: string, text: string): void {
    this.nameText.setText(name);
    this.lineText.setText(text).setAlpha(0);
    this.scene.tweens.add({ targets: this.lineText, alpha: 1, duration: 220 });
  }

  /** Варианты рисуются НАД окном, снизу вверх. */
  showOptions(options: readonly string[], onPick: (index: number) => void): void {
    this.clearOptions();
    options.forEach((text, i) => {
      const opt = this.scene.add
        .text(-this.boxWidth / 2, -34 - (options.length - 1 - i) * 66, `▸ ${text}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          color: '#f0e6d2',
          backgroundColor: '#26262ce8',
          padding: { x: 12, y: 8 },
          wordWrap: { width: this.boxWidth - 24 },
          fixedWidth: this.boxWidth,
        })
        .setOrigin(0, 1)
        .setInteractive({ useHandCursor: true });
      opt.on('pointerover', () => opt.setBackgroundColor('#3a3a44'));
      opt.on('pointerout', () => opt.setBackgroundColor('#26262ce8'));
      opt.on('pointerup', () => {
        this.clearOptions();
        onPick(i);
      });
      this.add(opt);
      this.optionTexts.push(opt);
    });
  }

  clearOptions(): void {
    this.optionTexts.forEach((o) => o.destroy());
    this.optionTexts = [];
  }

  /** Пьяное «плытие» текста. */
  updateSway(timeMs: number, amplitude: number): void {
    const t = timeMs / 1000;
    this.lineText.y = this.baseLineY + Math.sin(t * 2.1) * amplitude;
    this.lineText.x = -this.boxWidth / 2 + 16 + Math.sin(t * 1.4 + 1) * amplitude * 0.7;
    this.optionTexts.forEach((o, i) => {
      o.setAlpha(1 - Math.abs(Math.sin(t * 0.9 + i)) * 0.12 * amplitude);
    });
  }
}
