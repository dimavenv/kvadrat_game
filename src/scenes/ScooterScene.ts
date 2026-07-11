import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import type { AchievementId } from '../data/achievements';
import { STRINGS } from '../data/strings';
import { AudioManager } from '../systems/AudioManager';
import { DrunkMeter } from '../systems/DrunkMeter';
import { DrunkVisualFx } from '../systems/DrunkVisualFx';
import { SaveManager } from '../systems/SaveManager';
import { MuteButton } from '../ui/MuteButton';
import { showStageCard } from '../ui/StageCard';
import { showToast } from '../ui/Toast';

const OBSTACLE_KEYS = [
  'obstacle_curb',
  'obstacle_babka',
  'obstacle_manhole',
  'obstacle_dps',
  'obstacle_bump',
] as const;

/**
 * Стадия 1: эндлесс-раннер на самокате. Продержаться 60 секунд.
 * Пьяный дрифт синусоидой сносит с курса — надо подруливать.
 */
export class ScooterScene extends Phaser.Scene {
  private fx!: DrunkVisualFx;
  private road!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private hearts: Phaser.GameObjects.Image[] = [];
  private progressFill!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;

  private running = false;
  private over = false;
  private elapsed = 0;
  private hits = 0;
  private invulnUntil = 0;
  private targetX = 0;
  private steeredX = 0;
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('Scooter');
  }

  create(): void {
    const { width, height } = BALANCE.view;
    const b = BALANCE.scooter;
    this.running = false;
    this.over = false;
    this.elapsed = 0;
    this.hits = 0;
    this.invulnUntil = 0;
    this.hearts = [];

    this.road = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_road');

    this.player = this.physics.add.image(width / 2, height * 0.78, 'rodion_scooter');
    this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.55);
    this.targetX = width / 2;
    this.steeredX = width / 2;

    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, (_p, obs) => {
      this.onHit(obs as Phaser.Types.Physics.Arcade.ImageWithDynamicBody);
    });

    // Сердечки.
    for (let i = 0; i < b.hearts; i++) {
      this.hearts.push(this.add.image(30 + i * 42, 34, 'ui_heart').setDepth(920));
    }

    // Полоса прогресса до дома.
    this.add.rectangle(width / 2, 76, width - 80, 12, 0x1a1a1e).setStrokeStyle(3, 0x000000).setDepth(920);
    this.progressFill = this.add
      .rectangle(40 + 3, 76, 1, 7, 0x5fbf4a)
      .setOrigin(0, 0.5)
      .setDepth(921);
    this.add
      .text(width / 2, 56, STRINGS.scooter.goal, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#f0e6d2',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(920);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    new MuteButton(this, width - 36, 36);
    this.fx = new DrunkVisualFx(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.fx.destroy();
      this.spawnTimer?.remove();
    });

    this.cameras.main.fadeIn(350, 0, 0, 0);
    showStageCard(this, STRINGS.stages.stage1, STRINGS.stages.stage1Sub, STRINGS.scooter.controlsHint, () => {
      this.running = true;
      AudioManager.ensureMusic(this);
      AudioManager.play(this, 'bell', 0.8);
      this.scheduleSpawn();
    });
  }

  private currentSpeed(): number {
    const b = BALANCE.scooter;
    const t = Phaser.Math.Clamp(this.elapsed / b.speedRampSeconds, 0, 1);
    return Phaser.Math.Linear(b.speedStart, b.speedMax, t);
  }

  private scheduleSpawn(): void {
    if (this.over) return;
    const b = BALANCE.scooter;
    const t = Phaser.Math.Clamp(this.elapsed / b.speedRampSeconds, 0, 1);
    const delay = Phaser.Math.Linear(b.spawnMsStart, b.spawnMsMin, t);
    this.spawnTimer = this.time.delayedCall(delay, () => {
      this.spawnObstacle();
      this.scheduleSpawn();
    });
  }

  private spawnObstacle(): void {
    const { width } = BALANCE.view;
    const b = BALANCE.scooter;
    const key = OBSTACLE_KEYS[Phaser.Math.Between(0, OBSTACLE_KEYS.length - 1)];
    const left = width * b.roadLeft + 40;
    const right = width * b.roadRight - 40;
    const x = Phaser.Math.Between(left, right);

    const obs = this.obstacles.create(x, -80, key) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    obs.body.setSize(obs.width * 0.75, obs.height * 0.7);
    obs.setVelocityY(this.currentSpeed());
    // Бабка ходит поперёк дороги.
    if (key === 'obstacle_babka') {
      obs.setVelocityX(Phaser.Math.Between(0, 1) === 0 ? -45 : 45);
    }
  }

  override update(time: number, delta: number): void {
    this.fx.update(time, delta);
    if (!this.running || this.over) return;

    const { width, height } = BALANCE.view;
    const b = BALANCE.scooter;
    const dt = delta / 1000;
    this.elapsed += dt;

    // Дорога и прогресс.
    const speed = this.currentSpeed();
    this.road.tilePositionY -= speed * dt;
    const progress = Phaser.Math.Clamp(this.elapsed / b.surviveSeconds, 0, 1);
    this.progressFill.width = Math.max(1, (width - 86) * progress);

    // Управление: палец в нижней трети экрана.
    const pointer = this.input.activePointer;
    if (pointer.isDown && pointer.y > height * (2 / 3)) {
      this.targetX = pointer.x;
    }
    if (this.input.keyboard) {
      const leftHeld = this.cursors.left.isDown || this.keyA?.isDown === true;
      const rightHeld = this.cursors.right.isDown || this.keyD?.isDown === true;
      if (leftHeld) this.targetX -= b.keyboardSpeed * dt;
      if (rightHeld) this.targetX += b.keyboardSpeed * dt;
    }
    const minX = width * b.roadLeft;
    const maxX = width * b.roadRight;
    this.targetX = Phaser.Math.Clamp(this.targetX, minX, maxX);

    // Сглаженное следование + пьяный синусоидальный снос.
    const lerp = 1 - Math.pow(1 - b.steerLerp, delta / (1000 / 60));
    this.steeredX = Phaser.Math.Linear(this.steeredX, this.targetX, lerp);
    const t = time / 1000;
    const drift =
      (Math.sin(t * b.driftSpeed) * 0.65 + Math.sin(t * b.driftSpeed2 * 2.3 + 1.1) * 0.35) *
      b.driftAmpMax *
      DrunkMeter.t;
    this.player.x = Phaser.Math.Clamp(this.steeredX + drift, minX, maxX);
    this.player.setAngle((this.player.x - this.steeredX) * 0.12 + Math.sin(t * 2.2) * 4 * DrunkMeter.t);

    // Мигание при неуязвимости.
    this.player.setAlpha(time < this.invulnUntil ? 0.4 + 0.3 * Math.sin(time / 50) : 1);

    // Уборка уехавших препятствий.
    for (const child of this.obstacles.getChildren()) {
      const obs = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      obs.setVelocityY(speed);
      if (obs.y > height + 100) obs.destroy();
    }

    if (this.elapsed >= b.surviveSeconds) this.win();
  }

  private onHit(obs: Phaser.Types.Physics.Arcade.ImageWithDynamicBody): void {
    if (this.over || !this.running) return;
    const now = this.time.now;
    if (now < this.invulnUntil) return;
    this.invulnUntil = now + BALANCE.scooter.invulnMs;

    obs.destroy();
    this.hits += 1;
    AudioManager.play(this, 'hit');
    this.cameras.main.shake(180, 0.012);
    const heart = this.hearts[BALANCE.scooter.hearts - this.hits];
    if (heart) heart.setTint(0x333333).setAlpha(0.5);
    showToast(this, Phaser.Utils.Array.GetRandom([...STRINGS.scooter.hitPhrases]), '#f0e6d2');

    if (this.hits >= BALANCE.scooter.hearts) this.fail();
  }

  private win(): void {
    this.over = true;
    this.physics.pause();
    const unlocked: AchievementId[] = [];
    if (this.hits === 0 && SaveManager.unlockAchievement('iron_rider')) unlocked.push('iron_rider');
    this.endWithTitle(STRINGS.scooter.winTitle, '#5fbf4a', 'scooter_win', unlocked);
  }

  private fail(): void {
    this.over = true;
    this.physics.pause();
    AudioManager.play(this, 'thud');
    this.tweens.add({
      targets: this.player,
      angle: 96,
      y: this.player.y + 34,
      duration: 450,
      ease: 'Quad.easeIn',
    });
    this.endWithTitle(STRINGS.scooter.failTitle, '#d9304f', 'scooter_fall', []);
  }

  private endWithTitle(title: string, color: string, ending: string, achievements: AchievementId[]): void {
    const { width, height } = BALANCE.view;
    this.add
      .text(width / 2, height * 0.4, title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '44px',
        color,
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(930);
    this.time.delayedCall(1600, () => {
      this.scene.start('Ending', { id: ending, newAchievements: achievements });
    });
  }
}
