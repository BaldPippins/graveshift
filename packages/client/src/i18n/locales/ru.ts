import {
  EnemyKind,
  HeroId,
  MELEE_RULES,
  MERCHANT_RULES,
  PLAYER_RULES,
  UpgradeStat,
  WeaponClass,
  WeaponId,
} from '@graveshift/shared/config';
import { ErrorCode } from '@graveshift/shared/protocol';
import { PurchaseRejection } from '@graveshift/shared/rules';
import { keyLabel, KeyBinding } from '../../input/KeyBinding.ts';
import { AchievementId } from '../../meta/achievements/AchievementId.ts';
import { MULTIKILL_WINDOW_MILLISECONDS } from '../../meta/counters/counterRules.ts';
import { GraphicsQuality, TouchControlsMode } from '../../meta/settings/Settings.ts';
import { Locale } from '../Locale.ts';
import type { Messages } from '../Messages.ts';
import { percentBonus, pluralRu } from '../plural.ts';

const SHOP_KEY = keyLabel(KeyBinding.Shop);

function waves(count: number): string {
  return `${count} ${pluralRu(count, 'волну', 'волны', 'волн')}`;
}

function seconds(count: number): string {
  return `${count} ${pluralRu(count, 'секунду', 'секунды', 'секунд')}`;
}

function dead(count: number): string {
  return `${count} ${pluralRu(count, 'мертвеца', 'мертвецов', 'мертвецов')}`;
}

function coins(count: number): string {
  return `${count} ${pluralRu(count, 'монету', 'монеты', 'монет')}`;
}

const REVIVE_TIME = seconds(PLAYER_RULES.reviveSeconds);
const REVIVE_HELP_PERCENT = Math.round(PLAYER_RULES.reviveHelperBonus * 100);
const BLEEDOUT_TIME = seconds(PLAYER_RULES.bleedoutSeconds);
const MERCHANT_ABSENCE = waves(MERCHANT_RULES.absenceWaves);
const MULTIKILL_TIME = seconds(MULTIKILL_WINDOW_MILLISECONDS / 1000);
const FURY_KILLS = dead(MELEE_RULES.killsForFury);
const FURY_TIME = seconds(MELEE_RULES.furySeconds);

export const RU_MESSAGES: Messages = {
  locale: Locale.Russian,
  numberLocale: 'ru-RU',
  common: {
    back: 'Назад',
    continue: 'Продолжить',
    cancel: 'Отмена',
    choose: 'Выбрать',
    connecting: 'Подключаемся…',
    language: 'Язык',
    soundOn: 'Включить звук',
    soundOff: 'Выключить звук',
  },
  loading: {
    studioPresents: 'представляет',
    tagline: 'ночная смена на кладбище',
    tips: [
      'Призраки проходят сквозь ограды — не прячьтесь за ними.',
      'Встаньте рядом с упавшим союзником, чтобы поднять его.',
      `Лавка работает только рядом с торговцем — подойдите и нажмите ${SHOP_KEY}.`,
      'Святая винтовка прошивает нескольких врагов подряд.',
      'Бабушка Агата поднимает союзников быстрее всех.',
      'Сердца и тыквы лечат, монеты сами летят к вам в руки.',
      'Пули попадают в союзников. Урон по своим включает или отключает хозяин комнаты.',
      'Правая кнопка мыши — удар в ближнем бою. Задевает всех, кого зацепит взмах.',
      `Зарубите ${FURY_KILLS} в ближнем бою — оружие засияет и будет бить вдвое сильнее.`,
      'Пробел — прыжок: гробы, надгробия и ограды можно перепрыгнуть.',
      `Убили торговца? Оживите его у надгробия за ${coins(MERCHANT_RULES.revivePrice)}.`,
    ],
    assetsFailed: (error) => `Не удалось загрузить ассеты: ${error}`,
  },
  menu: {
    tagline: 'кооперативная ночная смена',
    nickname: 'Ваш ник',
    nicknamePlaceholder: 'Лысый Пиппин',
    changeHero: (title) => `${title} · сменить`,
    createRoom: '🪦 Создать смену',
    codePlaceholder: 'КОД',
    join: 'Войти',
    achievements: '🏆 Достижения',
    stats: '📊 Статистика',
    howToPlay: '📜 Как играть',
    settings: '⚙️ Настройки',
    sourceCode: 'Исходники на GitHub',
  },
  lobby: {
    title: (code) => `Смена ${code}`,
    subtitle: 'Матч начнётся, когда все отметятся «Готов»',
    changeHero: '🎭 Сменить героя',
    ready: '✔ Готов',
    notReady: 'Не готов',
    roomCode: 'Код комнаты',
    copyCode: 'Скопировать код',
    copyHint: (maxPlayers) => `нажмите, чтобы скопировать · до ${maxPlayers} игроков`,
    you: ' (вы)',
    bot: 'Бот',
    readyBadge: 'Готов',
    waitingBadge: 'Ждём',
    bots: '🤖 Боты-напарники',
    botsHostOnly: 'выбирает хозяин комнаты',
    waveCount: 'Количество волн',
    friendlyFire: 'Огонь по своим',
    botNames: ['Кузьмич', 'Фрося', 'Тихон'],
  },
  heroSelect: {
    health: 'Здоровье',
    speed: 'Скорость',
    takenBy: (names) => `Этого героя уже выбрал ${names} — можно и вдвоём.`,
  },
  hud: {
    countdown: (secondsLeft) => `Смена начнётся через ${secondsLeft}`,
    combat: (wave, total, enemies) => `Волна ${wave}/${total} · мертвецов: ${enemies}`,
    intermission: (secondsLeft) => `Передышка ${secondsLeft} с`,
    victory: 'Рассвет!',
    defeat: 'Смена окончена',
    shop: '🛒 Лавка',
    readyForWave: '⏭ Готов к волне',
    pause: 'Пауза',
    reloading: 'Перезарядка…',
    syncing: 'Синхронизация с сервером…',
    touchMove: '← двигаться',
    touchAim: 'тяни — прицел, за пунктир — огонь 🔥 →',
    ping: (milliseconds) => `${milliseconds} мс`,
    fury: '🔥 Ярость',
    furyCharge: (kills, total) => `${kills}/${total}`,
    reviveMerchant: (price) => `⚰️ Оживить торговца · 💰${price}`,
  },
  shop: {
    title: '⚰️ Лавка гробовщика',
    untilWave: (secondsLeft) => `до волны ${secondsLeft} с`,
    combatWarning: 'идёт бой, не зевайте!',
    close: 'Закрыть',
    heal: (percent) => `❤ Лечение +${percent}%`,
    buy: 'Купить',
    upgrade: 'Улучшить',
    upgradesTitle: 'Улучшения',
    upgradesLocked: 'Купите оружие, чтобы улучшать его',
    owned: 'Куплено',
    max: 'MAX',
    rangedSection: '🔫 Стволы',
    meleeSection: '🗡 Ближний бой',
    equip: 'Взять в руки',
    equipped: 'В руках',
    rate: (perSecond) => `${perSecond.toFixed(1)}/с`,
    reach: (cells) => `${cells.toFixed(1)} м`,
    arc: (degrees) => `${Math.round(degrees)}°`,
    percent: (fraction) => `${Math.round(fraction * 100)}%`,
    damageLabel: 'урон',
    dpsLabel: 'урон/с',
    magazineLabel: 'патронов',
    pierceLabel: 'целей насквозь',
    reachLabel: 'дальность',
    arcLabel: 'размах',
    critLabel: 'крит',
  },
  downed: {
    deadTitle: '⚰️ Вы пали',
    deadText: 'Вас поднимут после окончания волны. Подбадривайте выживших!',
    downedTitle: '🆘 Вы ранены',
    beingRevived: 'Вас поднимают…',
    waitingRevive: 'Союзник должен встать рядом, чтобы поднять вас',
    revive: 'Подъём',
    bleeding: 'Кровотечение',
  },
  scoreboard: {
    title: 'Смена',
    player: 'Игрок',
    hero: 'Герой',
    health: 'Здоровье',
    coins: 'Монеты',
    ping: 'Пинг',
  },
  pause: {
    title: '⏸ Перекур',
    text:
      'Мир не останавливается: ваш герой сел на землю и беззащитен. ' +
      'Союзники видят значок паузы.',
    resume: 'Вернуться в бой',
    settings: '⚙️ Настройки',
    leave: 'Покинуть смену',
  },
  reconnect: {
    title: 'Связь оборвалась',
    text: (attempt, total) =>
      `Ваш герой сидит на земле и ждёт. Переподключаемся… попытка ${attempt} из ${total}`,
  },
  results: {
    title: 'Итоги',
    victory: '🌅 Рассвет! Смена выстояла',
    defeat: '⚰️ Смену похоронили',
    subtitle: (wave, total, duration) => `Волна ${wave} из ${total} · ${duration}`,
    player: 'Игрок',
    score: 'Очки',
    kills: 'Убийства',
    bossKills: 'Боссы',
    damage: 'Урон',
    accuracy: 'Точность',
    revives: 'Подъёмы',
    downs: 'Падения',
    deaths: 'Смерти',
    coins: 'Монеты',
    newAchievements: 'Новые достижения',
  },
  stats: {
    title: 'Статистика',
    subtitle: 'Вся ваша карьера ночного сторожа',
    labels: {
      matchesPlayed: 'Смен отработано',
      wins: 'Рассветов встречено',
      bestWave: 'Лучшая волна',
      timePlayed: 'Время на кладбище',
      kills: 'Упокоено всего',
      accuracy: 'Точность',
      damageDealt: 'Урон нанесён',
      revives: 'Союзников поднято',
      downs: 'Падений',
      bestMultikill: 'Лучшая серия',
      coinsEarned: 'Монет заработано',
      coinsSpent: 'Монет потрачено',
      healsCollected: 'Лечилок подобрано',
      meleeKills: 'Зарублено вблизи',
      furies: 'Приступов ярости',
    },
    playTime: (hours, minutes, secondsPart) =>
      hours > 0
        ? `${hours} ч ${minutes.toString().padStart(2, '0')} мин`
        : `${minutes} мин ${secondsPart} с`,
  },
  achievements: {
    title: 'Достижения',
    progress: (unlocked, total) => `Открыто ${unlocked} из ${total}`,
  },
  howTo: {
    title: 'Как играть',
    subtitle: 'Продержитесь до рассвета',
    controlsTab: '🎮 Управление',
    shiftTab: '🕯 Смена',
    combatTab: '⚔ Бой',
    bestiaryTab: '💀 Бестиарий',
    keyboardTitle: '⌨️ Клавиатура и мышь',
    controls: [
      { keys: ['WASD'], action: 'движение' },
      { keys: ['мышь'], action: 'прицел' },
      { keys: ['ЛКМ'], action: 'огонь' },
      { keys: ['ПКМ'], action: 'удар в ближнем бою' },
      { keys: ['Пробел'], action: 'прыжок' },
      { keys: [keyLabel(KeyBinding.Reload)], action: 'перезарядка' },
      { keys: ['1–5', keyLabel(KeyBinding.CycleWeapon), 'колесо'], action: 'оружие' },
      { keys: [SHOP_KEY], action: 'лавка у торговца' },
      { keys: [keyLabel(KeyBinding.Scoreboard)], action: 'таблица' },
      { keys: [keyLabel(KeyBinding.Pause)], action: 'пауза' },
    ],
    touchTitle: '📱 Телефон',
    touchControls: [
      { keys: ['левый стик'], action: 'движение' },
      { keys: ['правый стик'], action: 'прицел, за пунктирным кругом — огонь 🔥' },
      { keys: ['🗡'], action: 'удар, держите — серия' },
      { keys: ['⤒'], action: 'прыжок' },
      { keys: ['⟳'], action: 'перезарядка' },
      { keys: ['🔫'], action: 'смена ствола' },
      { keys: ['🛒'], action: 'лавка; можно нажать табличку торговца' },
      { keys: ['⏸'], action: 'пауза' },
    ],
    shiftRules: [
      'Мертвецы лезут из открытых могил волнами. Добейте всех, чтобы волна закончилась.',
      `Здоровье на нуле — вы ранены. Союзник рядом поднимет вас за ${REVIVE_TIME}, ` +
        `каждый следующий помогающий — ещё +${REVIVE_HELP_PERCENT}% к скорости.`,
      `Не подняли за ${BLEEDOUT_TIME} — ждёте следующей волны. Все ранены — смена окончена.`,
      'Торговец в центре продаёт стволы и прокачку. ' +
        `Его можно убить — тогда лавка закрыта на ${MERCHANT_ABSENCE}.`,
      'Убитого торговца можно оживить у его надгробия за ' +
        `${coins(MERCHANT_RULES.revivePrice)} — не дожидаясь, пока он вернётся сам.`,
      'Пауза в коопе не останавливает мир: ваш герой сядет на землю и будет беззащитен.',
    ],
    combatRules: [
      'В лавке оружие сначала покупают, потом улучшают: урон, темп и магазин у стволов, ' +
        'урон, скорость и крит у ближнего.',
      'Ближний бой задевает всех, кого зацепил взмах. ' +
        `За ${FURY_KILLS}, зарубленных вблизи, приходит ярость: оружие светится ${FURY_TIME}, ` +
        `урон ×${MELEE_RULES.furyDamageMultiplier}.`,
      'Прыжком можно перемахнуть гроб, надгробие или ограду и встать на гроб сверху. ' +
        'Деревья, фонари, склепы и стены кладбища не перепрыгнуть.',
      'Урон по союзникам от пуль и ударов настраивается в лобби. Торговца ранит всегда.',
    ],
  },
  settings: {
    title: 'Настройки',
    graphics: 'Графика',
    qualities: {
      [GraphicsQuality.Low]: 'Низкое',
      [GraphicsQuality.Medium]: 'Среднее',
      [GraphicsQuality.High]: 'Высокое',
    },
    touch: 'Сенсорное управление',
    touchModes: {
      [TouchControlsMode.Auto]: 'Авто',
      [TouchControlsMode.Always]: 'Всегда',
      [TouchControlsMode.Never]: 'Никогда',
    },
    screenShake: 'Тряска камеры от урона',
    cameraAimLead: 'Камера смещается к прицелу',
    showFps: 'Показывать FPS и пинг',
    screen: 'Экран',
    fullscreen: '⛶ Полный экран',
    progress: 'Прогресс',
    reset: 'Сбросить статистику и достижения',
    confirmReset: 'Точно сбросить',
    sound: 'Звук',
    volume: 'Громкость',
    soundEnabled: '🔊 Вкл',
    soundDisabled: '🔇 Выкл',
  },
  notices: {
    merchantDead: 'Торговец убит',
    merchantDeadHint: (count, price) =>
      `Лавка закрыта ещё на ${waves(count)}. Оживить у надгробия — 💰${price}`,
    shopAtMerchant: 'Лавка у торговца',
    shopAtMerchantHint: 'Подойдите к нему в центре кладбища',
    readyForWave: 'Вы готовы к следующей волне',
    waitingOthers: 'Ждём остальных…',
    progressReset: 'Прогресс сброшен',
    fullscreenUnavailable: 'Полноэкранный режим недоступен',
    fullscreenExitFailed: 'Не удалось выйти из полноэкранного режима',
    enterNickname: 'Введите ник',
    nicknameRule: 'Ник не подходит',
    connectFailed: 'Не удалось подключиться',
    serverUnavailable: 'Сервер недоступен',
    reconnected: 'Связь восстановлена',
    reconnectedHint: 'Возвращаемся в строй',
    achievement: (title) => `Достижение: ${title}`,
    matchAborted: 'Матч прерван сервером',
    shiftStarts: 'Ночная смена начинается',
    shiftStartsHint: 'Продержитесь до рассвета',
    wave: (wave) => `Волна ${wave}`,
    waveOf: (total) => `из ${total}`,
    bossIncoming: 'Что-то большое идёт сюда…',
    waveCleared: 'Волна зачищена',
    waveClearedHint: `Торговец ждёт в центре — ${SHOP_KEY} или 🛒`,
    merchantKilled: 'Торговца убили!',
    merchantClosedFor: (count) => `Лавка закрыта на ${waves(count)}`,
    merchantBack: 'Торговец вернулся',
    merchantBackHint: 'Лавка снова открыта',
    merchantRevived: (nickname) => `${nickname} оживил торговца`,
    furyUnleashed: '🔥 Ярость!',
    furyUnleashedHint: (secondsLeft, multiplier) =>
      `Урон ×${multiplier} на ${seconds(secondsLeft)} — рубите!`,
    friendlyFire: 'Огонь по своим!',
    friendlyFireHint: 'Вы ранили союзника',
    shotByAlly: 'Вас подстрелил союзник',
    connectionLost: 'Соединение потеряно',
  },
  merchantSign: {
    idle: '🛒 Лавка',
    key: SHOP_KEY,
    tap: '👆 коснитесь',
    serving: (prompt) => `🛒 Лавка · ${prompt}`,
    grave: (count, price) =>
      `✝ Торговец мёртв · вернётся через ${waves(count)}\n` +
      `Подойдите, чтобы оживить за ${coins(price)}`,
    revive: (price, prompt) => `⚰️ Оживить сейчас · 💰${price} · ${prompt}`,
  },
  errors: {
    [ErrorCode.VersionMismatch]: 'Версия клиента устарела — обновите страницу',
    [ErrorCode.InvalidNickname]: 'Ник не подходит',
    [ErrorCode.RoomNotFound]: 'Комната не найдена',
    [ErrorCode.RoomFull]: 'Комната заполнена',
    [ErrorCode.MatchInProgress]: 'В комнате уже идёт матч',
    [ErrorCode.NotInRoom]: 'Вы не в комнате',
    [ErrorCode.MalformedMessage]: 'Ошибка протокола',
    [ErrorCode.HandshakeRequired]: 'Сначала нужно представиться серверу',
  },
  purchaseRejections: {
    [PurchaseRejection.MerchantTooFar]: 'Подойдите к торговцу',
    [PurchaseRejection.NotEnoughCoins]: 'Не хватает монет',
    [PurchaseRejection.AlreadyOwned]: 'Уже куплено',
    [PurchaseRejection.WeaponLocked]: 'Сначала купите оружие',
    [PurchaseRejection.MaxLevel]: 'Максимальный уровень',
    [PurchaseRejection.FullHealth]: 'Здоровье и так полное',
    [PurchaseRejection.NotAlive]: 'Мёртвым не продаём',
    [PurchaseRejection.MerchantGone]: 'Торговец убит — лавка закрыта',
    [PurchaseRejection.MerchantAlive]: 'Торговец и так жив',
  },
  heroes: {
    [HeroId.Pippin]: {
      name: 'Лысый Пиппин',
      title: 'Могильщик',
      perk: (modifiers) =>
        `Толстокожий: получает на ${percentBonus(modifiers.damageTakenMultiplier)}% меньше урона`,
      story: 'Копал могилы сорок лет. Теперь закапывает тех, кто из них вылез.',
    },
    [HeroId.Watchman]: {
      name: 'Сторож Гаврила',
      title: 'Ночной сторож',
      perk: (modifiers) =>
        `Меткий глаз: +${percentBonus(modifiers.damageMultiplier)}% урона любым оружием`,
      story: 'Свисток потерял, зато нашёл бластер. Обход кладбища — по расписанию.',
    },
    [HeroId.Lamplighter]: {
      name: 'Фонарщица Лиза',
      title: 'Фонарщица',
      perk: (modifiers) =>
        `Быстрые руки: +${percentBonus(modifiers.fireRateMultiplier)}% скорострельности, ` +
        'самая быстрая',
      story: 'Зажигает фонари раньше, чем мертвецы успевают моргнуть.',
    },
    [HeroId.Undertaker]: {
      name: 'Гробовщик Мортимер',
      title: 'Гробовщик',
      perk: (modifiers) => `Деловая хватка: +${percentBonus(modifiers.coinMultiplier)}% монет`,
      story: 'Каждый упокоенный — потенциальный клиент. Бизнес идёт в гору.',
    },
    [HeroId.Agatha]: {
      name: 'Бабушка Агата',
      title: 'Травница',
      perk: (modifiers) =>
        `Тёплые руки: поднимает союзников в ${modifiers.reviveSpeedMultiplier} раза быстрее, ` +
        `лечит себя на ${modifiers.healthRegenPerSecond} HP/с`,
      story: 'Пережила трёх мужей и два зомби-апокалипсиса. Пирожки — по выходным.',
    },
  },
  enemies: {
    [EnemyKind.Zombie]: {
      name: 'Зомби',
      description: 'Медленный, но упрямый. Приходит толпой с первой волны.',
    },
    [EnemyKind.Skeleton]: {
      name: 'Скелет',
      description: 'Хрупкий и шустрый. Не даёт расслабиться со второй волны.',
    },
    [EnemyKind.Ghost]: {
      name: 'Призрак',
      description: 'Проходит сквозь ограды и склепы. Появляется с третьей волны.',
    },
    [EnemyKind.Brute]: {
      name: 'Упырь-громила',
      description: 'Огромный запас здоровья и тяжёлый удар. Держите дистанцию.',
    },
    [EnemyKind.Vampire]: {
      name: 'Граф Носфератус',
      description: 'Хозяин кладбища. Приходит перед рассветом на последней волне.',
    },
    [EnemyKind.Bat]: {
      name: 'Нетопырь',
      description:
        'Летает над оградами и могилами. Лопатой не достать — только стволы. С третьей волны.',
    },
  },
  weapons: {
    [WeaponId.Pistol]: {
      name: 'Фонарный пистоль',
      description: () => 'Надёжный и бесплатный. С ним начинают все.',
    },
    [WeaponId.Smg]: {
      name: 'Свечной автомат',
      description: () => 'Поливает свинцом. Слабый урон, высокий темп.',
    },
    [WeaponId.Shotgun]: {
      name: 'Костолом',
      description: (stats) =>
        `${stats.pellets} ${pluralRu(stats.pellets, 'дробина', 'дробины', 'дробин')} в упор. ` +
        'Королева узких проходов.',
    },
    [WeaponId.Rifle]: {
      name: 'Святая винтовка',
      description: (stats) => `Пробивает до ${stats.pierce + 1} врагов насквозь.`,
    },
    [WeaponId.Gatling]: {
      name: 'Похоронный пулемёт',
      description: (stats) => `${stats.magazineSize} патронов неумолимого возмездия.`,
    },
  },
  meleeWeapons: {
    [WeaponId.Shovel]: {
      name: 'Верная лопата',
      description: () => 'Копала могилы — закопает и мертвецов. Широкий замах.',
    },
    [WeaponId.Sword]: {
      name: 'Кладбищенский меч',
      description: () => 'Быстрый и острый. Рубит всё, что рядом.',
    },
    [WeaponId.Spear]: {
      name: 'Копьё стражника',
      description: (stats) => `Колет на ${stats.reach.toFixed(1)} м узким выпадом.`,
    },
    [WeaponId.Axe]: {
      name: 'Топор палача',
      description: () => 'Медленный, но разваливает пополам.',
    },
    [WeaponId.Warhammer]: {
      name: 'Молот упокоения',
      description: () => 'Крутится вокруг себя и сносит всех вокруг.',
    },
  },
  upgrades: {
    [WeaponClass.Ranged]: {
      [UpgradeStat.Damage]: 'Урон',
      [UpgradeStat.FireRate]: 'Темп',
      [UpgradeStat.Capacity]: 'Магазин',
    },
    [WeaponClass.Melee]: {
      [UpgradeStat.Damage]: 'Урон',
      [UpgradeStat.FireRate]: 'Скорость',
      [UpgradeStat.Capacity]: 'Крит',
    },
  },
  achievementTexts: {
    [AchievementId.FirstBlood]: {
      title: 'Первая кровь',
      description: () => 'Упокойте первого мертвеца',
    },
    [AchievementId.NightWatch]: {
      title: 'Ночной дозор',
      description: (target) => `Упокойте ${dead(target)}`,
    },
    [AchievementId.Gravedigger]: {
      title: 'Заслуженный могильщик',
      description: (target) => `Упокойте ${dead(target)}`,
    },
    [AchievementId.Ghostbuster]: {
      title: 'Охотник за привидениями',
      description: (target) =>
        `Развейте ${target} ${pluralRu(target, 'призрака', 'призраков', 'призраков')}`,
    },
    [AchievementId.BatSwatter]: {
      title: 'Гроза нетопырей',
      description: (target) =>
        `Подстрелите ${target} ${pluralRu(target, 'нетопыря', 'нетопырей', 'нетопырей')}`,
    },
    [AchievementId.BoneCollector]: {
      title: 'Костный мозг',
      description: (target) =>
        `Разберите на кости ${target} ${pluralRu(target, 'скелет', 'скелета', 'скелетов')}`,
    },
    [AchievementId.BruteForce]: {
      title: 'Против лома',
      description: (target) =>
        `Одолейте ${target} ${pluralRu(target, 'упыря-громилу', 'упырей-громил', 'упырей-громил')}`,
    },
    [AchievementId.CountDown]: {
      title: 'Граф повержен',
      description: () => 'Победите графа Носфератуса',
    },
    [AchievementId.NoOneLeftBehind]: {
      title: 'Своих не бросаем',
      description: () => 'Поднимите раненого союзника',
    },
    [AchievementId.GuardianAngel]: {
      title: 'Ангел-хранитель',
      description: (target) =>
        `Поднимите союзников ${target} ${pluralRu(target, 'раз', 'раза', 'раз')}`,
    },
    [AchievementId.Dawn]: {
      title: 'Рассвет',
      description: () => 'Доживите до утра — пройдите все волны матча',
    },
    [AchievementId.Regular]: {
      title: 'Завсегдатай',
      description: (target) => `Сыграйте ${target} ${pluralRu(target, 'матч', 'матча', 'матчей')}`,
    },
    [AchievementId.Untouchable]: {
      title: 'Ни царапины',
      description: () => 'Пройдите волну, не получив урона',
    },
    [AchievementId.MeatGrinder]: {
      title: 'Мясорубка',
      description: (target) =>
        `${target} ${pluralRu(target, 'убийство', 'убийства', 'убийств')} за ${MULTIKILL_TIME}`,
    },
    [AchievementId.BigSpender]: {
      title: 'Транжира',
      description: (target) => `Потратьте ${target} монет в лавке`,
    },
    [AchievementId.MaxedOut]: {
      title: 'На пределе',
      description: () => 'Прокачайте параметр оружия до максимума',
    },
    [AchievementId.Arsenal]: { title: 'Арсенал', description: () => 'Соберите все стволы за матч' },
    [AchievementId.Survivor]: {
      title: 'Выживший',
      description: (target) => `Переживите волну ${target}`,
    },
    [AchievementId.Herbalist]: {
      title: 'Сердцеед',
      description: (target) => `Подберите ${target} сердец или тыкв`,
    },
    [AchievementId.Slasher]: {
      title: 'Рубака',
      description: (target) => `Зарубите в ближнем бою ${dead(target)}`,
    },
    [AchievementId.Butcher]: {
      title: 'Мясник',
      description: (target) => `Зарубите в ближнем бою ${dead(target)}`,
    },
    [AchievementId.Berserk]: {
      title: 'Берсерк',
      description: () => 'Впадите в ярость',
    },
    [AchievementId.Bladesmith]: {
      title: 'Оружейная',
      description: () => 'Соберите всё оружие ближнего боя за матч',
    },
    [AchievementId.Necromancer]: {
      title: 'Некромант',
      description: () => 'Оживите убитого торговца',
    },
  },
};
