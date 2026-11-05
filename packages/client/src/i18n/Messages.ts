import type {
  EnemyKind,
  HeroId,
  HeroModifiers,
  MeleeStats,
  MeleeWeaponId,
  RangedStats,
  RangedWeaponId,
  TrapKind,
  UpgradeStat,
  WeaponClass,
} from '@graveshift/shared/config';
import type { ErrorCode } from '@graveshift/shared/protocol';
import type { PurchaseRejection } from '@graveshift/shared/rules';
import type { AchievementId } from '../meta/achievements/AchievementId.ts';
import type { GraphicsQuality, TouchControlsMode } from '../meta/settings/Settings.ts';
import type { Locale } from './Locale.ts';

export interface HeroTexts {
  readonly name: string;
  readonly title: string;
  readonly perk: (modifiers: HeroModifiers) => string;
  readonly story: string;
}

export interface WeaponTexts {
  readonly name: string;
  readonly description: (stats: RangedStats) => string;
}

export interface MeleeWeaponTexts {
  readonly name: string;
  readonly description: (stats: MeleeStats) => string;
}

export interface AchievementTexts {
  readonly title: string;
  readonly description: (target: number) => string;
}

export interface DescribedTexts {
  readonly name: string;
  readonly description: string;
}

export interface KeyHint {
  readonly keys: readonly string[];
  readonly action: string;
}

export interface CommonTexts {
  readonly back: string;
  readonly continue: string;
  readonly cancel: string;
  readonly choose: string;
  readonly connecting: string;
  readonly language: string;
  readonly soundOn: string;
  readonly soundOff: string;
}

export interface LoadingTexts {
  readonly studioPresents: string;
  readonly tagline: string;
  readonly tips: readonly string[];
  readonly assetsFailed: (error: string) => string;
}

export interface MenuTexts {
  readonly tagline: string;
  readonly nickname: string;
  readonly nicknamePlaceholder: string;
  readonly changeHero: (title: string) => string;
  readonly createRoom: string;
  readonly codePlaceholder: string;
  readonly join: string;
  readonly achievements: string;
  readonly stats: string;
  readonly howToPlay: string;
  readonly settings: string;
  readonly studioLink: string;
}

export interface LobbyTexts {
  readonly title: (code: string) => string;
  readonly subtitle: string;
  readonly changeHero: string;
  readonly ready: string;
  readonly notReady: string;
  readonly roomCode: string;
  readonly copyCode: string;
  readonly copyHint: (maxPlayers: number) => string;
  readonly you: string;
  readonly bot: string;
  readonly readyBadge: string;
  readonly waitingBadge: string;
  readonly bots: string;
  readonly botsHostOnly: string;
  readonly waveCount: string;
  readonly friendlyFire: string;
  readonly botNames: readonly string[];
}

export interface HeroSelectTexts {
  readonly health: string;
  readonly speed: string;
  readonly takenBy: (names: string) => string;
}

export interface HudTexts {
  readonly countdown: (seconds: number) => string;
  readonly combat: (wave: number, total: number, enemies: number) => string;
  readonly intermission: (seconds: number) => string;
  readonly victory: string;
  readonly defeat: string;
  readonly shop: string;
  readonly readyForWave: string;
  readonly pause: string;
  readonly reloading: string;
  readonly syncing: string;
  readonly touchMove: string;
  readonly touchAim: string;
  readonly ping: (milliseconds: number) => string;
  readonly fury: string;
  readonly furyCharge: (kills: number, total: number) => string;
  readonly reviveMerchant: (price: number) => string;
}

export interface ShopTexts {
  readonly title: string;
  readonly untilWave: (seconds: number) => string;
  readonly combatWarning: string;
  readonly close: string;
  readonly heal: (percent: number) => string;
  readonly buy: string;
  readonly upgrade: string;
  readonly upgradesTitle: string;
  readonly upgradesLocked: string;
  readonly owned: string;
  readonly max: string;
  readonly rangedSection: string;
  readonly meleeSection: string;
  readonly equip: string;
  readonly equipped: string;
  readonly rate: (perSecond: number) => string;
  readonly reach: (cells: number) => string;
  readonly arc: (degrees: number) => string;
  readonly percent: (fraction: number) => string;
  readonly damageLabel: string;
  readonly dpsLabel: string;
  readonly magazineLabel: string;
  readonly pierceLabel: string;
  readonly reachLabel: string;
  readonly arcLabel: string;
  readonly critLabel: string;
}

export interface DownedTexts {
  readonly deadTitle: string;
  readonly deadText: string;
  readonly downedTitle: string;
  readonly beingRevived: string;
  readonly waitingRevive: string;
  readonly revive: string;
  readonly bleeding: string;
}

export interface ScoreboardTexts {
  readonly title: string;
  readonly hero: string;
  readonly health: string;
  readonly coins: string;
  readonly kdr: string;
  readonly ping: string;
}

export interface PauseTexts {
  readonly title: string;
  readonly text: string;
  readonly resume: string;
  readonly settings: string;
  readonly leave: string;
}

export interface ReconnectTexts {
  readonly title: string;
  readonly text: (attempt: number, total: number) => string;
}

export interface ResultsTexts {
  readonly title: string;
  readonly victory: string;
  readonly defeat: string;
  readonly subtitle: (wave: number, total: number, duration: string) => string;
  readonly player: string;
  readonly score: string;
  readonly kills: string;
  readonly bossKills: string;
  readonly damage: string;
  readonly accuracy: string;
  readonly revives: string;
  readonly downs: string;
  readonly deaths: string;
  readonly coins: string;
  readonly newAchievements: string;
}

export interface StatLabels {
  readonly matchesPlayed: string;
  readonly wins: string;
  readonly bestWave: string;
  readonly timePlayed: string;
  readonly kills: string;
  readonly accuracy: string;
  readonly damageDealt: string;
  readonly revives: string;
  readonly downs: string;
  readonly bestMultikill: string;
  readonly coinsEarned: string;
  readonly coinsSpent: string;
  readonly healsCollected: string;
  readonly meleeKills: string;
  readonly furies: string;
}

export interface StatsTexts {
  readonly title: string;
  readonly subtitle: string;
  readonly labels: StatLabels;
  readonly playTime: (hours: number, minutes: number, seconds: number) => string;
}

export interface AchievementsTexts {
  readonly title: string;
  readonly progress: (unlocked: number, total: number) => string;
}

export interface HowToTexts {
  readonly title: string;
  readonly subtitle: string;
  readonly controlsTab: string;
  readonly shiftTab: string;
  readonly combatTab: string;
  readonly bestiaryTab: string;
  readonly keyboardTitle: string;
  readonly controls: readonly KeyHint[];
  readonly touchTitle: string;
  readonly touchControls: readonly KeyHint[];
  readonly shiftRules: readonly string[];
  readonly combatRules: readonly string[];
}

export interface SettingsTexts {
  readonly title: string;
  readonly graphics: string;
  readonly qualities: Readonly<Record<GraphicsQuality, string>>;
  readonly touch: string;
  readonly touchModes: Readonly<Record<TouchControlsMode, string>>;
  readonly screenShake: string;
  readonly cameraAimLead: string;
  readonly showFps: string;
  readonly screen: string;
  readonly fullscreen: string;
  readonly progress: string;
  readonly reset: string;
  readonly confirmReset: string;
  readonly sound: string;
  readonly volume: string;
  readonly soundEnabled: string;
  readonly soundDisabled: string;
}

export interface NoticeTexts {
  readonly merchantDead: string;
  readonly merchantDeadHint: (waves: number, revivePrice: number) => string;
  readonly shopAtMerchant: string;
  readonly shopAtMerchantHint: string;
  readonly readyForWave: string;
  readonly waitingOthers: string;
  readonly progressReset: string;
  readonly fullscreenUnavailable: string;
  readonly fullscreenExitFailed: string;
  readonly enterNickname: string;
  readonly nicknameRule: string;
  readonly connectFailed: string;
  readonly serverUnavailable: string;
  readonly reconnected: string;
  readonly reconnectedHint: string;
  readonly achievement: (title: string) => string;
  readonly matchAborted: string;
  readonly shiftStarts: string;
  readonly shiftStartsHint: string;
  readonly wave: (wave: number) => string;
  readonly waveOf: (total: number) => string;
  readonly bossIncoming: string;
  readonly waveCleared: string;
  readonly waveClearedHint: string;
  readonly merchantKilled: string;
  readonly merchantClosedFor: (waves: number) => string;
  readonly merchantBack: string;
  readonly merchantBackHint: string;
  readonly merchantRevived: (nickname: string) => string;
  readonly furyUnleashed: string;
  readonly furyUnleashedHint: (seconds: number, multiplier: number) => string;
  readonly friendlyFire: string;
  readonly friendlyFireHint: string;
  readonly shotByAlly: string;
  readonly connectionLost: string;
  readonly snared: string;
  readonly snaredHint: string;
}

export interface MerchantSignTexts {
  readonly idle: string;
  readonly key: string;
  readonly tap: string;
  readonly serving: (prompt: string) => string;
  readonly grave: (waves: number, revivePrice: number) => string;
  readonly revive: (revivePrice: number, prompt: string) => string;
}

export interface TrapSignTexts {
  readonly names: Readonly<Record<TrapKind, string>>;
  readonly idle: (name: string, price: number) => string;
  readonly offer: (name: string, price: number, prompt: string) => string;
}

export interface Messages {
  readonly locale: Locale;
  readonly numberLocale: string;
  readonly common: CommonTexts;
  readonly loading: LoadingTexts;
  readonly menu: MenuTexts;
  readonly lobby: LobbyTexts;
  readonly heroSelect: HeroSelectTexts;
  readonly hud: HudTexts;
  readonly shop: ShopTexts;
  readonly downed: DownedTexts;
  readonly scoreboard: ScoreboardTexts;
  readonly pause: PauseTexts;
  readonly reconnect: ReconnectTexts;
  readonly results: ResultsTexts;
  readonly stats: StatsTexts;
  readonly achievements: AchievementsTexts;
  readonly howTo: HowToTexts;
  readonly settings: SettingsTexts;
  readonly notices: NoticeTexts;
  readonly merchantSign: MerchantSignTexts;
  readonly trapSign: TrapSignTexts;
  readonly errors: Readonly<Record<ErrorCode, string>>;
  readonly purchaseRejections: Readonly<Record<PurchaseRejection, string>>;
  readonly heroes: Readonly<Record<HeroId, HeroTexts>>;
  readonly enemies: Readonly<Record<EnemyKind, DescribedTexts>>;
  readonly weapons: Readonly<Record<RangedWeaponId, WeaponTexts>>;
  readonly meleeWeapons: Readonly<Record<MeleeWeaponId, MeleeWeaponTexts>>;
  readonly upgrades: Readonly<Record<WeaponClass, Readonly<Record<UpgradeStat, string>>>>;
  readonly achievementTexts: Readonly<Record<AchievementId, AchievementTexts>>;
}
