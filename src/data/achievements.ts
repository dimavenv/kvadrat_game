export type AchievementId =
  | 'yorsh'
  | 'drowned_scooter'
  | 'blackout_start'
  | 'teetotaler'
  | 'dads_recipe'
  | 'umri_first'
  | 'since_4th_grade'
  | 'square_circle'
  | 'kiss'
  | 'iron_rider';

export interface Achievement {
  id: AchievementId;
  title: string;
  text: string;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'yorsh', title: 'Ёрш', text: 'Смешал три разных типа напитков. Организм подал жалобу.' },
  { id: 'drowned_scooter', title: 'Утопил самокат', text: 'Выловил из озера электросамокат. Кто-то доехал ещё хуже тебя.' },
  { id: 'blackout_start', title: 'Отключка на старте', text: 'Вырубился прямо в баре. Вечер прошёл без тебя.' },
  { id: 'teetotaler', title: 'Трезвенник', text: 'Не выпил ни капли и пошёл домой. Батя не поймёт.' },
  { id: 'dads_recipe', title: 'Батин рецепт', text: 'Попробовал батин самогон. 60 градусов уважения.' },
  { id: 'umri_first', title: '«Умри»', text: 'Первый слив от Петровны. Добро пожаловать в клуб, там уже одиннадцать лет как открыто.' },
  { id: 'since_4th_grade', title: 'С четвёртого класса', text: 'Слился десять раз подряд. Стабильность — признак Квадратного.' },
  { id: 'square_circle', title: 'Квадратный круг', text: 'Поймал трёх толстолобиков на озере Круглом.' },
  { id: 'kiss', title: 'Чудо случилось', text: 'Она поцеловала его сама. Календарь отмечен красным.' },
  { id: 'iron_rider', title: 'Руль держал', text: 'Доехал на самокате без единого столкновения.' },
] as const;

export function achievementById(id: AchievementId): Achievement {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown achievement: ${id}`);
  return a;
}
