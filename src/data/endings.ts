export type EndingId =
  | 'scooter_win'
  | 'scooter_fall'
  | 'fishing_win'
  | 'fishing_boot'
  | 'kiss'
  | 'umri'
  | 'blackout'
  | 'sober';

export interface Ending {
  id: EndingId;
  /** Ключ текстуры картинки концовки. */
  textureKey: string;
  title: string;
  text: string;
  /** Победная ли концовка (для окраски в галерее). */
  isWin: boolean;
}

export const ENDINGS: readonly Ending[] = [
  {
    id: 'scooter_win',
    textureKey: 'ending_scooter_win',
    title: 'ДОЕХАЛ',
    text: 'Самокат доставлен. Родион доставлен. Порядок доставки уточняется.',
    isWin: true,
  },
  {
    id: 'scooter_fall',
    textureKey: 'ending_scooter_fall',
    title: 'ПРИЛЁГ',
    text: 'Асфальт оказался ближе, чем дом. Самокат уехал сам — он-то трезвый.',
    isWin: false,
  },
  {
    id: 'fishing_win',
    textureKey: 'ending_fishing_win',
    title: 'ТРИ ТОЛСТОЛОБИКА',
    text: 'Озеро Круглое, результат квадратный. Дед на том берегу молча зааплодировал.',
    isWin: true,
  },
  {
    id: 'fishing_boot',
    textureKey: 'ending_fishing_boot',
    title: 'ПРИШЁЛ ДОМОЙ С САПОГОМ',
    text: 'Зато левый. Правый — в следующий раз.',
    isWin: false,
  },
  {
    id: 'kiss',
    textureKey: 'ending_kiss',
    title: 'ЧУДО У ЛАРЬКА',
    text: 'Одиннадцать лет. ОДИННАДЦАТЬ ЛЕТ. Она поцеловала его сама. Свидетелей нет, но Родион запомнит навсегда.',
    isWin: true,
  },
  {
    id: 'umri',
    textureKey: 'ending_umri',
    title: '«УМРИ»',
    text: 'ну и ладно. как в четвёртом классе.',
    isWin: false,
  },
  {
    id: 'blackout',
    textureKey: 'ending_blackout',
    title: 'ОТКЛЮЧКА',
    text: 'Сходил, называется. До двери бара оставалось четыре метра.',
    isWin: false,
  },
  {
    id: 'sober',
    textureKey: 'ending_sober',
    title: 'ТРЕЗВЫЙ ПОШЁЛ ДОМОЙ',
    text: 'Чай. Кровать. Здоровый сон. Скукота смертная, зато утром не стыдно.',
    isWin: true,
  },
] as const;

export function endingById(id: EndingId): Ending {
  const e = ENDINGS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown ending: ${id}`);
  return e;
}
