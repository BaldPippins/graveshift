import {
  EnemyKind,
  HeroId,
  MERCHANT_RULES,
  PLAYER_RULES,
  UpgradeStat,
  WAVE_RULES,
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
import { percentBonus, pluralEn } from '../plural.ts';

const SHOP_KEY = keyLabel(KeyBinding.Shop);

function counted(count: number, one: string, other: string): string {
  return `${count} ${pluralEn(count, one, other)}`;
}

const REVIVE_TIME = counted(PLAYER_RULES.reviveSeconds, 'second', 'seconds');
const BLEEDOUT_TIME = counted(PLAYER_RULES.bleedoutSeconds, 'second', 'seconds');
const MERCHANT_ABSENCE = counted(MERCHANT_RULES.absenceWaves, 'wave', 'waves');
const MULTIKILL_TIME = counted(MULTIKILL_WINDOW_MILLISECONDS / 1000, 'second', 'seconds');

export const EN_MESSAGES: Messages = {
  locale: Locale.English,
  numberLocale: 'en-US',
  common: {
    back: 'Back',
    continue: 'Continue',
    cancel: 'Cancel',
    choose: 'Choose',
    connecting: 'Connecting…',
    language: 'Language',
  },
  loading: {
    studioPresents: 'presents',
    tagline: 'night shift at the graveyard',
    tips: [
      'Ghosts walk through fences — do not hide behind them.',
      'Stand next to a downed ally to revive them.',
      `The shop only works next to the merchant — walk up and press ${SHOP_KEY}.`,
      'The holy rifle pierces several enemies in a row.',
      'Granny Agatha revives allies faster than anyone.',
      'Hearts and pumpkins heal, coins fly straight into your pockets.',
      'Friendly fire is on — never shoot through your allies.',
    ],
    assetsFailed: (error) => `Failed to load assets: ${error}`,
  },
  menu: {
    tagline: 'co-op night shift',
    nickname: 'Your nickname',
    nicknamePlaceholder: 'Bald Pippin',
    changeHero: (title) => `${title} · change`,
    createRoom: '🪦 Start a shift',
    codePlaceholder: 'CODE',
    join: 'Join',
    achievements: '🏆 Achievements',
    stats: '📊 Statistics',
    howToPlay: '📜 How to play',
    settings: '⚙️ Settings',
  },
  lobby: {
    title: (code) => `Shift ${code}`,
    subtitle: 'The match starts once everyone is ready',
    changeHero: '🎭 Change hero',
    ready: '✔ Ready',
    notReady: 'Not ready',
    roomCode: 'Room code',
    copyCode: 'Copy code',
    copyHint: (maxPlayers) => `click to copy · up to ${maxPlayers} players`,
    you: ' (you)',
    bot: 'Bot',
    readyBadge: 'Ready',
    waitingBadge: 'Waiting',
    bots: '🤖 Bot teammates',
    botsHostOnly: 'chosen by the room host',
    botNames: ['Kuzmich', 'Frosya', 'Tikhon'],
  },
  heroSelect: {
    health: 'Health',
    speed: 'Speed',
    takenBy: (names) => `${names} already picked this hero — you can both play it.`,
  },
  hud: {
    countdown: (secondsLeft) => `Shift starts in ${secondsLeft}`,
    combat: (wave, total, enemies) => `Wave ${wave}/${total} · undead: ${enemies}`,
    intermission: (secondsLeft) => `Break ${secondsLeft} s`,
    victory: 'Dawn!',
    defeat: 'Shift over',
    shop: '🛒 Shop',
    readyForWave: '⏭ Ready for wave',
    pause: 'Pause',
    reloading: 'Reloading…',
    syncing: 'Syncing with server…',
    touchMove: '← move',
    touchAim: 'aim and shoot →',
  },
  shop: {
    title: '⚰️ Undertaker shop',
    untilWave: (secondsLeft) => `next wave in ${secondsLeft} s`,
    combatWarning: 'combat in progress, stay sharp!',
    buy: 'Buy',
    perSecond: '/s',
    pierce: (targets) => `pierces ${targets}`,
    max: 'MAX',
  },
  downed: {
    deadTitle: '⚰️ You fell',
    deadText: 'You will be back after the wave. Cheer for the survivors!',
    downedTitle: '🆘 You are down',
    beingRevived: 'Reviving…',
    waitingRevive: 'An ally must stand next to you to revive you',
    revive: 'Revive',
    bleeding: 'Bleeding out',
  },
  scoreboard: { title: 'Shift', player: 'Player', hero: 'Hero', health: 'Health', coins: 'Coins' },
  pause: {
    title: '⏸ Smoke break',
    text: 'The world keeps going: your hero sits down and is defenceless. Allies see a pause icon.',
    resume: 'Back to the fight',
    settings: '⚙️ Settings',
    leave: 'Leave the shift',
  },
  reconnect: {
    title: 'Connection lost',
    text: (attempt, total) =>
      `Your hero sits and waits. Reconnecting… attempt ${attempt} of ${total}`,
  },
  results: {
    title: 'Results',
    victory: '🌅 Dawn! The shift held',
    defeat: '⚰️ The shift is buried',
    subtitle: (wave, total, duration) => `Wave ${wave} of ${total} · ${duration}`,
    player: 'Player',
    kills: 'Kills',
    damage: 'Damage',
    accuracy: 'Accuracy',
    revives: 'Revives',
    downs: 'Downs',
    coins: 'Coins',
    newAchievements: 'New achievements',
  },
  stats: {
    title: 'Statistics',
    subtitle: 'Your whole career as a night watchman',
    labels: {
      matchesPlayed: 'Shifts worked',
      wins: 'Dawns seen',
      bestWave: 'Best wave',
      timePlayed: 'Time in the graveyard',
      kills: 'Undead put to rest',
      accuracy: 'Accuracy',
      damageDealt: 'Damage dealt',
      revives: 'Allies revived',
      downs: 'Times downed',
      bestMultikill: 'Best streak',
      coinsEarned: 'Coins earned',
      coinsSpent: 'Coins spent',
      healsCollected: 'Heals picked up',
    },
    playTime: (hours, minutes, secondsPart) =>
      hours > 0
        ? `${hours} h ${minutes.toString().padStart(2, '0')} min`
        : `${minutes} min ${secondsPart} s`,
  },
  achievements: {
    title: 'Achievements',
    progress: (unlocked, total) => `Unlocked ${unlocked} of ${total}`,
  },
  howTo: {
    title: 'How to play',
    subtitle: `Hold out for ${counted(WAVE_RULES.totalWaves, 'wave', 'waves')} until dawn`,
    controlsTitle: 'Controls',
    controls: [
      { keys: ['WASD'], action: 'move' },
      { keys: ['mouse'], action: 'aim' },
      { keys: ['LMB'], action: 'fire' },
      { keys: [keyLabel(KeyBinding.Reload)], action: 'reload' },
      { keys: ['1–5', keyLabel(KeyBinding.CycleWeapon), 'wheel'], action: 'weapons' },
      { keys: [SHOP_KEY], action: 'shop at the merchant' },
      { keys: [keyLabel(KeyBinding.Scoreboard)], action: 'scoreboard' },
      { keys: [keyLabel(KeyBinding.Pause)], action: 'pause' },
    ],
    touchHint: '📱 Left stick moves, right stick aims and shoots',
    rulesTitle: 'Shift rules',
    rules: [
      'The undead crawl out of open graves in waves. Kill them all to end the wave.',
      `At zero health you are down. An ally next to you revives you in ${REVIVE_TIME}.`,
      `Not revived within ${BLEEDOUT_TIME} — wait for the next wave. ` +
        'Everyone down — shift over.',
      'The merchant in the centre sells weapons and upgrades. ' +
        `He can be killed — then the shop closes for ${MERCHANT_ABSENCE}.`,
      'Friendly fire is on: your bullets hurt allies and the merchant.',
      'Pausing in co-op does not stop the world: your hero sits down and is defenceless.',
    ],
    bestiaryTitle: 'Bestiary',
  },
  settings: {
    title: 'Settings',
    graphics: 'Graphics',
    qualities: {
      [GraphicsQuality.Low]: 'Low',
      [GraphicsQuality.Medium]: 'Medium',
      [GraphicsQuality.High]: 'High',
    },
    touch: 'Touch controls',
    touchModes: {
      [TouchControlsMode.Auto]: 'Auto',
      [TouchControlsMode.Always]: 'Always',
      [TouchControlsMode.Never]: 'Never',
    },
    screenShake: 'Camera shake',
    showFps: 'Show FPS and ping',
    screen: 'Screen',
    fullscreen: '⛶ Fullscreen',
    progress: 'Progress',
    reset: 'Reset statistics and achievements',
    confirmReset: 'Yes, reset',
  },
  notices: {
    merchantDead: 'The merchant is dead',
    merchantDeadHint: (count) =>
      `The shop stays closed for ${counted(count, 'more wave', 'more waves')}`,
    shopAtMerchant: 'The shop is at the merchant',
    shopAtMerchantHint: 'Walk up to him in the centre of the graveyard',
    readyForWave: 'You are ready for the next wave',
    waitingOthers: 'Waiting for the others…',
    progressReset: 'Progress reset',
    fullscreenUnavailable: 'Fullscreen is not available',
    fullscreenExitFailed: 'Could not leave fullscreen',
    enterNickname: 'Enter a nickname',
    nicknameRule: 'This nickname will not work',
    connectFailed: 'Could not connect',
    serverUnavailable: 'Server unavailable',
    reconnected: 'Connection restored',
    reconnectedHint: 'Back in the fight',
    achievement: (title) => `Achievement: ${title}`,
    matchAborted: 'The server aborted the match',
    shiftStarts: 'The night shift begins',
    shiftStartsHint: 'Hold out until dawn',
    wave: (wave) => `Wave ${wave}`,
    waveOf: (total) => `of ${total}`,
    bossIncoming: 'Something big is coming…',
    waveCleared: 'Wave cleared',
    waveClearedHint: `The merchant waits in the centre — ${SHOP_KEY} or 🛒`,
    merchantKilled: 'The merchant was killed!',
    merchantClosedFor: (count) => `The shop is closed for ${counted(count, 'wave', 'waves')}`,
    merchantBack: 'The merchant is back',
    merchantBackHint: 'The shop is open again',
    friendlyFire: 'Friendly fire!',
    friendlyFireHint: 'You hit an ally',
    shotByAlly: 'An ally shot you',
    connectionLost: 'Connection lost',
  },
  merchantSign: {
    idle: '🛒 Shop',
    serving: `🛒 Shop · ${SHOP_KEY}`,
    closed: (count) => `✝ Shop closed · ${count}`,
  },
  errors: {
    [ErrorCode.VersionMismatch]: 'Your client is outdated — reload the page',
    [ErrorCode.InvalidNickname]: 'This nickname will not work',
    [ErrorCode.RoomNotFound]: 'Room not found',
    [ErrorCode.RoomFull]: 'The room is full',
    [ErrorCode.MatchInProgress]: 'A match is already running in this room',
    [ErrorCode.NotInRoom]: 'You are not in a room',
    [ErrorCode.MalformedMessage]: 'Protocol error',
    [ErrorCode.HandshakeRequired]: 'Introduce yourself to the server first',
  },
  purchaseRejections: {
    [PurchaseRejection.MerchantTooFar]: 'Walk up to the merchant',
    [PurchaseRejection.NotEnoughCoins]: 'Not enough coins',
    [PurchaseRejection.AlreadyOwned]: 'Already owned',
    [PurchaseRejection.WeaponLocked]: 'Buy the weapon first',
    [PurchaseRejection.MaxLevel]: 'Maximum level',
    [PurchaseRejection.FullHealth]: 'Health is already full',
    [PurchaseRejection.NotAlive]: 'No sales to the dead',
    [PurchaseRejection.MerchantGone]: 'The merchant is dead — shop closed',
  },
  heroes: {
    [HeroId.Pippin]: {
      name: 'Bald Pippin',
      title: 'Gravedigger',
      perk: (modifiers) =>
        `Thick skin: takes ${percentBonus(modifiers.damageTakenMultiplier)}% less damage`,
      story: 'Dug graves for forty years. Now buries whatever crawls back out.',
    },
    [HeroId.Watchman]: {
      name: 'Watchman Gavrila',
      title: 'Night watchman',
      perk: (modifiers) =>
        `Keen eye: +${percentBonus(modifiers.damageMultiplier)}% damage with any weapon`,
      story: 'Lost his whistle, found a blaster. Patrols the graveyard on schedule.',
    },
    [HeroId.Lamplighter]: {
      name: 'Liza the Lamplighter',
      title: 'Lamplighter',
      perk: (modifiers) =>
        `Quick hands: +${percentBonus(modifiers.fireRateMultiplier)}% fire rate, the fastest`,
      story: 'Lights the lamps before the dead can blink.',
    },
    [HeroId.Undertaker]: {
      name: 'Mortimer the Undertaker',
      title: 'Undertaker',
      perk: (modifiers) => `Business sense: +${percentBonus(modifiers.coinMultiplier)}% coins`,
      story: 'Every corpse is a potential client. Business is booming.',
    },
    [HeroId.Agatha]: {
      name: 'Granny Agatha',
      title: 'Herbalist',
      perk: (modifiers) =>
        `Warm hands: revives allies ${modifiers.reviveSpeedMultiplier}× faster, ` +
        `heals ${modifiers.healthRegenPerSecond} HP/s`,
      story: 'Outlived three husbands and two zombie apocalypses. Pies on weekends.',
    },
  },
  enemies: {
    [EnemyKind.Zombie]: {
      name: 'Zombie',
      description: 'Slow but stubborn. Comes in crowds from the first wave.',
    },
    [EnemyKind.Skeleton]: {
      name: 'Skeleton',
      description: 'Brittle and quick. Keeps you busy from the second wave.',
    },
    [EnemyKind.Ghost]: {
      name: 'Ghost',
      description: 'Drifts through fences and crypts. Appears from the third wave.',
    },
    [EnemyKind.Brute]: {
      name: 'Ghoul brute',
      description: 'Huge health pool and a heavy hit. Keep your distance.',
    },
    [EnemyKind.Vampire]: {
      name: 'Count Nosferatus',
      description: 'Master of the graveyard. Arrives before dawn on the final wave.',
    },
  },
  weapons: {
    [WeaponId.Pistol]: {
      name: 'Lantern pistol',
      description: () => 'Reliable and free. Everyone starts with it.',
    },
    [WeaponId.Smg]: {
      name: 'Candle SMG',
      description: () => 'Sprays lead. Low damage, high rate of fire.',
    },
    [WeaponId.Shotgun]: {
      name: 'Bonebreaker',
      description: (stats) =>
        `${counted(stats.pellets, 'pellet', 'pellets')} point blank. Queen of narrow paths.`,
    },
    [WeaponId.Rifle]: {
      name: 'Holy rifle',
      description: (stats) => `Pierces up to ${counted(stats.pierce + 1, 'enemy', 'enemies')}.`,
    },
    [WeaponId.Gatling]: {
      name: 'Funeral gatling',
      description: (stats) => `${stats.magazineSize} rounds of relentless retribution.`,
    },
  },
  upgrades: {
    [UpgradeStat.Damage]: 'Damage',
    [UpgradeStat.FireRate]: 'Rate',
    [UpgradeStat.Capacity]: 'Magazine',
  },
  achievementTexts: {
    [AchievementId.FirstBlood]: {
      title: 'First blood',
      description: () => 'Put your first undead to rest',
    },
    [AchievementId.NightWatch]: {
      title: 'Night watch',
      description: (target) => `Put ${target} undead to rest`,
    },
    [AchievementId.Gravedigger]: {
      title: 'Master gravedigger',
      description: (target) => `Put ${target} undead to rest`,
    },
    [AchievementId.Ghostbuster]: {
      title: 'Ghostbuster',
      description: (target) => `Dispel ${counted(target, 'ghost', 'ghosts')}`,
    },
    [AchievementId.BoneCollector]: {
      title: 'Bone collector',
      description: (target) => `Break ${counted(target, 'skeleton', 'skeletons')} into bones`,
    },
    [AchievementId.BruteForce]: {
      title: 'Brute force',
      description: (target) => `Defeat ${counted(target, 'ghoul brute', 'ghoul brutes')}`,
    },
    [AchievementId.CountDown]: {
      title: 'Count down',
      description: () => 'Defeat Count Nosferatus',
    },
    [AchievementId.NoOneLeftBehind]: {
      title: 'No one left behind',
      description: () => 'Revive a downed ally',
    },
    [AchievementId.GuardianAngel]: {
      title: 'Guardian angel',
      description: (target) => `Revive allies ${counted(target, 'time', 'times')}`,
    },
    [AchievementId.Dawn]: {
      title: 'Dawn',
      description: () => `Survive until morning — clear all ${WAVE_RULES.totalWaves} waves`,
    },
    [AchievementId.Regular]: {
      title: 'Regular',
      description: (target) => `Play ${counted(target, 'match', 'matches')}`,
    },
    [AchievementId.Untouchable]: {
      title: 'Untouchable',
      description: () => 'Clear a wave without taking damage',
    },
    [AchievementId.MeatGrinder]: {
      title: 'Meat grinder',
      description: (target) => `${counted(target, 'kill', 'kills')} within ${MULTIKILL_TIME}`,
    },
    [AchievementId.BigSpender]: {
      title: 'Big spender',
      description: (target) => `Spend ${target} coins in the shop`,
    },
    [AchievementId.MaxedOut]: { title: 'Maxed out', description: () => 'Max out a weapon stat' },
    [AchievementId.Arsenal]: {
      title: 'Arsenal',
      description: () => 'Own every weapon in one match',
    },
    [AchievementId.Survivor]: {
      title: 'Survivor',
      description: (target) => `Survive wave ${target}`,
    },
    [AchievementId.Herbalist]: {
      title: 'Heartbreaker',
      description: (target) => `Pick up ${target} hearts or pumpkins`,
    },
  },
};
