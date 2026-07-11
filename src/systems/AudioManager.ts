import Phaser from 'phaser';
import { SaveManager } from './SaveManager';

/**
 * Обёртка над звуком: нет файла → тихо скипаем, не падаем.
 */
class AudioManagerImpl {
  private musicStarted = false;

  /** Проиграть SFX, если файл существует. */
  play(scene: Phaser.Scene, key: string, volume = 1): void {
    if (!scene.cache.audio.exists(key)) return;
    try {
      scene.sound.play(key, { volume });
    } catch {
      // WebAudio ещё не разблокирован жестом — молча пропускаем
    }
  }

  /** Запустить фоновую тему (один раз на игру). */
  ensureMusic(scene: Phaser.Scene): void {
    if (this.musicStarted) return;
    if (!scene.cache.audio.exists('music')) return;
    try {
      scene.sound.play('music', { loop: true, volume: 0.4 });
      this.musicStarted = true;
    } catch {
      // попробуем в следующий раз
    }
  }

  applyMuteState(scene: Phaser.Scene): void {
    scene.sound.mute = SaveManager.muted;
  }

  toggleMute(scene: Phaser.Scene): boolean {
    SaveManager.muted = !SaveManager.muted;
    scene.sound.mute = SaveManager.muted;
    return SaveManager.muted;
  }
}

export const AudioManager = new AudioManagerImpl();
