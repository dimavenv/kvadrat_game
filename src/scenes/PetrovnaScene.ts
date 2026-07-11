import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DIALOGUE, DRUNK_GARBLE, GARBLE_REACTIONS, type DialogueNode } from '../data/dialogue';
import { STRINGS } from '../data/strings';
import { AudioManager } from '../systems/AudioManager';
import { DrunkMeter } from '../systems/DrunkMeter';
import { DrunkVisualFx } from '../systems/DrunkVisualFx';
import { DialogueBox } from '../ui/DialogueBox';
import { MuteButton } from '../ui/MuteButton';
import { showStageCard } from '../ui/StageCard';

interface ShownOption {
  text: string;
  garbled: boolean;
  sourceIndex: number;
}

/**
 * Стадия 3: визуальная новелла у ларька. Скрытая шкала симпатии.
 * Чем выше drunk, тем чаще варианты подменяются пьяным бредом:
 * пил для храбрости — а теперь не можешь связать двух слов.
 */
export class PetrovnaScene extends Phaser.Scene {
  private fx!: DrunkVisualFx;
  private box!: DialogueBox;
  private rodion!: Phaser.GameObjects.Image;
  private nastya!: Phaser.GameObjects.Image;
  private nodeIndex = 0;
  private sympathy = 0;
  private finished = false;

  constructor() {
    super('Petrovna');
  }

  create(): void {
    const { width, height } = BALANCE.view;
    this.nodeIndex = 0;
    this.sympathy = BALANCE.petrovna.sympathyStart;
    this.finished = false;

    this.add.image(width / 2, height / 2, 'bg_kiosk').setDisplaySize(width, height);
    this.rodion = this.add.image(width * 0.22, height * 0.52, 'rodion_idle').setScale(0.85);
    this.nastya = this.add.image(width + 120, height * 0.52, 'nastya').setScale(0.9);

    this.box = new DialogueBox(this, width / 2, height - 160, width - 32);

    new MuteButton(this, width - 36, 36);
    this.fx = new DrunkVisualFx(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.fx.destroy());

    this.cameras.main.fadeIn(350, 0, 0, 0);
    showStageCard(this, STRINGS.stages.stage3, STRINGS.stages.stage3Sub, STRINGS.petrovna.intro, () => {
      AudioManager.ensureMusic(this);
      this.tweens.add({
        targets: this.nastya,
        x: width * 0.74,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => this.showNode(),
      });
    });
  }

  override update(time: number, delta: number): void {
    this.fx.update(time, delta);
    // Родион переминается, текст плывёт.
    this.rodion.setAngle(Math.sin(time / 450) * 4 * DrunkMeter.t);
    this.box.updateSway(time, BALANCE.petrovna.textSwayMax * DrunkMeter.t);
  }

  /** Сколько вариантов подменить бредом на этой реплике. */
  private garbleCount(): number {
    const p = BALANCE.petrovna;
    const d = DrunkMeter.value;
    if (d > p.doubleGarbleDrunk) return 2;
    const span = Phaser.Math.Clamp(
      (d - BALANCE.drunk.stage2Max - 1) / (p.doubleGarbleDrunk - BALANCE.drunk.stage2Max - 1),
      0,
      1
    );
    const chance = Phaser.Math.Linear(p.garbleChanceMin, p.garbleChanceMax, span);
    return Math.random() < chance ? 1 : 0;
  }

  private buildOptions(node: DialogueNode): ShownOption[] {
    const garbles = this.garbleCount();
    const indices = Phaser.Utils.Array.Shuffle([0, 1, 2]).slice(0, garbles);
    const pool = Phaser.Utils.Array.Shuffle([...DRUNK_GARBLE]);
    return node.options.map((opt, i) => {
      const gi = indices.indexOf(i);
      if (gi >= 0) return { text: pool[gi % pool.length], garbled: true, sourceIndex: i };
      return { text: opt.text, garbled: false, sourceIndex: i };
    });
  }

  private showNode(): void {
    if (this.finished) return;
    const node = DIALOGUE[this.nodeIndex];
    if (!node) {
      this.finale();
      return;
    }
    this.box.showLine('Петровна', node.nastya);
    const shown = this.buildOptions(node);
    this.time.delayedCall(450, () => {
      if (this.finished) return;
      this.box.showOptions(
        shown.map((o) => o.text),
        (i) => this.pick(node, shown[i])
      );
    });
  }

  private pick(node: DialogueNode, choice: ShownOption): void {
    const p = BALANCE.petrovna;
    let reaction: string;
    if (choice.garbled) {
      this.sympathy += p.garblePenalty;
      reaction = Phaser.Utils.Array.GetRandom([...GARBLE_REACTIONS]);
    } else {
      const opt = node.options[choice.sourceIndex];
      this.sympathy += opt.delta;
      reaction = opt.reaction;
    }

    // Настя реагирует; лёгкая мимика вместо статики.
    this.box.showLine('Петровна', reaction);
    this.tweens.add({
      targets: this.nastya,
      angle: choice.garbled ? -3 : 2,
      duration: 160,
      yoyo: true,
    });

    this.nodeIndex += 1;
    this.time.delayedCall(1500, () => this.showNode());
  }

  private finale(): void {
    this.finished = true;
    this.box.clearOptions();
    if (this.sympathy >= BALANCE.petrovna.sympathyWin) this.kiss();
    else this.umri();
  }

  /** Победа: инициатива всегда её. Чудо, впервые за одиннадцать лет. */
  private kiss(): void {
    const { width, height } = BALANCE.view;
    this.box.showLine('Петровна', '…Так. Стой ровно и молчи. Один раз.');
    this.tweens.add({
      targets: this.nastya,
      x: this.rodion.x + 105,
      duration: 900,
      delay: 700,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        AudioManager.play(this, 'kiss');
        const heart = this.add
          .text(this.rodion.x + 55, this.rodion.y - 120, '❤', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '46px',
            color: '#d9304f',
          })
          .setOrigin(0.5)
          .setDepth(931);
        this.tweens.add({ targets: heart, y: heart.y - 60, alpha: 0, duration: 1400 });
        this.tweens.add({ targets: this.rodion, angle: 8, duration: 300, yoyo: true });

        const caption = this.add
          .text(width / 2, height * 0.24, STRINGS.petrovna.kissTitle, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '24px',
            color: '#f0e6d2',
            stroke: '#000000',
            strokeThickness: 6,
          })
          .setOrigin(0.5)
          .setDepth(931)
          .setAlpha(0);
        this.tweens.add({ targets: caption, alpha: 1, delay: 500, duration: 500 });
        this.time.delayedCall(2600, () => this.scene.start('Ending', { id: 'kiss' }));
      },
    });
  }

  /** Провал: фирменное «Умри» через плечо — и ушла к подругам. */
  private umri(): void {
    const { width, height } = BALANCE.view;
    this.box.showLine('Петровна', STRINGS.petrovna.umriLine);

    const umri = this.add
      .text(width / 2, height * 0.3, STRINGS.petrovna.umriLine.toUpperCase(), {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '64px',
        color: '#d9304f',
        stroke: '#000000',
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setDepth(931)
      .setAlpha(0)
      .setScale(2);
    this.tweens.add({ targets: umri, alpha: 1, scale: 1, delay: 600, duration: 350, ease: 'Back.easeIn' });

    this.tweens.add({
      targets: this.nastya,
      x: width + 140,
      flipX: true,
      duration: 1100,
      delay: 1500,
      ease: 'Quad.easeIn',
      onComplete: () => {
        const caption = this.add
          .text(width / 2, height * 0.45, STRINGS.petrovna.failCaption, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#cbbfa8',
            stroke: '#000000',
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(931)
          .setAlpha(0);
        this.tweens.add({ targets: caption, alpha: 1, duration: 600 });
        this.time.delayedCall(2100, () => this.scene.start('Ending', { id: 'umri' }));
      },
    });
  }
}
