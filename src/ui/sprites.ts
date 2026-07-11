import Phaser from 'phaser';
import { imageAsset } from '../config/assets';

/**
 * Приводит спрайт к КОНТРАКТНОМУ размеру из реестра (× factor), независимо от
 * реального разрешения PNG. Нейронка отдаёт файлы в произвольном разрешении —
 * без этого спрайт рисуется в натуральную величину и раздувается на весь экран.
 *
 * Если анимируешь scale — бери базовый масштаб из `sprite.scaleX` ПОСЛЕ вызова
 * и умножай на него, иначе абсолютный scale сбросит размер обратно к разрешению
 * файла.
 */
export function sizeToContract<T extends Phaser.GameObjects.Image>(image: T, key: string, factor = 1): T {
  const a = imageAsset(key);
  image.setDisplaySize(a.width * factor, a.height * factor);
  return image;
}
