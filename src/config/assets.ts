/**
 * Единый реестр ассетов: ключ → путь. Подробный контракт — в ASSETS.md.
 * Пока файла нет, Boot-сцена генерирует цветной плейсхолдер с подписью ключа.
 * Замена файла в /public/assets не требует правок кода.
 */

export interface ImageAsset {
  key: string;
  path: string;
  width: number;
  height: number;
  /** Цвет плейсхолдера. */
  color: number;
}

export interface AudioAsset {
  key: string;
  path: string;
  loop?: boolean;
}

const img = (key: string, width: number, height: number, color: number): ImageAsset => ({
  key,
  path: `assets/img/${key}.png`,
  width,
  height,
  color,
});

export const IMAGE_ASSETS: readonly ImageAsset[] = [
  // Фоны (480×854)
  img('bg_menu', 480, 854, 0x2b2137),
  img('bg_bar', 480, 854, 0x3a2a1e),
  img('bg_road', 480, 854, 0x3c3c40),
  img('bg_lake', 480, 854, 0x27403c),
  img('bg_kiosk', 480, 854, 0x33283a),

  // Персонажи
  img('rodion_idle', 200, 300, 0xc98a4b),
  img('rodion_scooter', 110, 150, 0xc98a4b),
  img('rodion_fishing', 180, 260, 0xc98a4b),
  img('nastya', 190, 300, 0x7a4b63),
  img('ded', 100, 140, 0x6b705c),

  // Бутылки (64×128)
  img('bottle_beer', 64, 128, 0xd9a441),
  img('bottle_wine', 64, 128, 0x8e2f48),
  img('bottle_liqueur', 64, 128, 0xa4602a),
  img('bottle_vodka', 64, 128, 0xbcd4e6),
  img('bottle_moonshine', 64, 128, 0xd8d3c0),

  // Препятствия (самокат)
  img('obstacle_curb', 110, 42, 0x8f9299),
  img('obstacle_babka', 84, 112, 0x9c6b8e),
  img('obstacle_manhole', 92, 52, 0x1f2023),
  img('obstacle_dps', 84, 122, 0x4d6d9a),
  img('obstacle_bump', 150, 32, 0xb8a53d),

  // Рыбалка
  img('bobber', 32, 48, 0xd94f30),
  img('catch_tolstolobik', 130, 64, 0x7fa8b8),
  img('catch_boot', 90, 90, 0x5b4636),
  img('catch_rotan', 90, 46, 0x66703f),
  img('catch_scooter', 120, 100, 0x777d86),
  img('catch_bottle', 50, 100, 0x9db08a),

  // UI
  img('ui_heart', 34, 34, 0xd9304f),

  // Картинки концовок (400×300)
  img('ending_scooter_win', 400, 300, 0x4f7a4a),
  img('ending_scooter_fall', 400, 300, 0x7a4a4a),
  img('ending_fishing_win', 400, 300, 0x4a6d7a),
  img('ending_fishing_boot', 400, 300, 0x5b4636),
  img('ending_kiss', 400, 300, 0x9a4a72),
  img('ending_umri', 400, 300, 0x3d3d46),
  img('ending_blackout', 400, 300, 0x141418),
  img('ending_sober', 400, 300, 0x6d7a4a),
] as const;

const sfx = (key: string, loop = false): AudioAsset => ({
  key,
  path: `assets/sfx/${key}.mp3`,
  loop,
});

export const AUDIO_ASSETS: readonly AudioAsset[] = [
  sfx('glug'), // буль-буль
  sfx('gulp'), // глоток
  sfx('burp'), // отрыжка
  sfx('bell'), // звонок самоката
  sfx('hit'), // удар
  sfx('thud'), // падение тела
  sfx('splash'), // всплеск
  sfx('reel'), // катушка
  sfx('kiss'), // чмок
  sfx('music', true), // фоновая тема (луп)
] as const;

export function imageAsset(key: string): ImageAsset {
  const a = IMAGE_ASSETS.find((x) => x.key === key);
  if (!a) throw new Error(`Unknown image asset: ${key}`);
  return a;
}
