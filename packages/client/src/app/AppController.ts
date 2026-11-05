import { effect } from '@preact/signals-core';
import type { ReadonlySignal } from '@preact/signals-core';
import {
  MELEE_RULES,
  MERCHANT_RULES,
  SIMULATION,
  STARTING_RANGED_WEAPON,
} from '@graveshift/shared/config';
import type {
  EnemyKind,
  HeroId,
  MatchSettings,
  RangedWeaponId,
  WeaponId,
} from '@graveshift/shared/config';
import { MatchOutcome } from '@graveshift/shared/model';
import { ClientMessageType, GameEventType, ServerMessageType } from '@graveshift/shared/protocol';
import type {
  GameEvent,
  MatchEndedMessage,
  MatchStartedMessage,
  RoomMemberInfo,
  RoomStateMessage,
  SnapshotMessage,
} from '@graveshift/shared/protocol';
import {
  isBossWave,
  isFinalWave,
  MerchantAccess,
  sanitizeNickname,
  ShopOfferKind,
} from '@graveshift/shared/rules';
import type { ShopOffer } from '@graveshift/shared/rules';
import { ACHIEVEMENT_ICONS } from '../content/achievementContent.ts';
import { ClientEventType } from '../game/events/ClientEvent.ts';
import type { ClientEventBus } from '../game/events/ClientEventBus.ts';
import type { WorldFrame } from '../game/view/WorldFrame.ts';
import { playerName } from '../i18n/localeMessages.ts';
import type { Messages } from '../i18n/Messages.ts';
import type { InputCommands } from '../input/InputCommands.ts';
import type { AchievementId } from '../meta/achievements/AchievementId.ts';
import { achievementTarget } from '../meta/achievements/achievementCatalog.ts';
import type { ProgressionService } from '../meta/ProgressionService.ts';
import { TouchControlsMode } from '../meta/settings/Settings.ts';
import type { Settings } from '../meta/settings/Settings.ts';
import type { SettingsStore } from '../meta/settings/SettingsStore.ts';
import type { GameAudio } from '../audio/GameAudio.ts';
import { CROSSHAIR_CURSOR } from '../content/crosshairCursor.ts';
import { SoundId } from '../audio/SoundId.ts';
import type { NetClient } from '../net/NetClient.ts';
import { ViewMode } from '../render/ViewMode.ts';
import { AimGuideMode } from '../render/views/AimGuideMode.ts';
import type { WorldRenderer } from '../render/WorldRenderer.ts';
import type { AppCommands } from './AppCommands.ts';
import { AppScreen } from './AppScreen.ts';
import type { ConnectionManager } from './ConnectionManager.ts';
import { GameSession } from './GameSession.ts';
import { HandshakeError } from './HandshakeError.ts';
import type { Notifier } from './Notifier.ts';
import { buildHud } from './presenters/buildHud.ts';
import type { UiState } from './state/UiState.ts';

const HUD_REFRESH_SECONDS = 1 / 15;
const FPS_SAMPLE_SECONDS = 0.5;
const FRIENDLY_FIRE_NOTICE_MILLISECONDS = 3000;
const STUDIO_SPLASH_MILLISECONDS = 1100;
const EMPTY_LINEUP: readonly HeroId[] = [];

export interface AppControllerDependencies {
  readonly ui: UiState;
  readonly net: NetClient;
  readonly connection: ConnectionManager;
  readonly bus: ClientEventBus;
  readonly settings: SettingsStore;
  readonly progression: ProgressionService;
  readonly messages: ReadonlySignal<Messages>;
  readonly notifier: Notifier;
  readonly audio: GameAudio;
  readonly createWorld: () => WorldRenderer;
  readonly captureEnemyPortraits: () => ReadonlyMap<EnemyKind, string>;
  readonly gameSurface: HTMLElement;
}

function screenViewMode(screen: AppScreen): ViewMode {
  switch (screen) {
    case AppScreen.Game:
      return ViewMode.Game;
    case AppScreen.Lobby:
    case AppScreen.HeroSelect:
    case AppScreen.Results:
      return ViewMode.Showcase;
    case AppScreen.Loading:
    case AppScreen.MainMenu:
    case AppScreen.Achievements:
    case AppScreen.Stats:
    case AppScreen.Settings:
    case AppScreen.HowToPlay:
      return ViewMode.Menu;
  }
}

export class AppController implements AppCommands, InputCommands {
  private readonly deps: AppControllerDependencies;

  private get text(): Messages {
    return this.deps.messages.value;
  }

  private world: WorldRenderer | null = null;
  private session: GameSession | null = null;
  private heroScreenReturn: AppScreen = AppScreen.MainMenu;
  private matchAchievements: AchievementId[] = [];
  private hudCooldown = 0;
  private fpsFrames = 0;
  private fpsElapsed = 0;
  private lastFriendlyFireNotice = Number.NEGATIVE_INFINITY;

  constructor(deps: AppControllerDependencies) {
    this.deps = deps;
    this.subscribeToServer();
    this.subscribeToEvents();
    window.addEventListener('pagehide', () => {
      this.reportMatchLeft();
    });
  }

  async boot(loadAssets: (onProgress: (fraction: number) => void) => Promise<void>): Promise<void> {
    const ui = this.deps.ui;
    const splash = new Promise<void>((resolve) => {
      window.setTimeout(resolve, STUDIO_SPLASH_MILLISECONDS);
    });
    try {
      await loadAssets((fraction) => {
        ui.loadProgress.value = fraction;
      });
      await splash;
    } catch (error: unknown) {
      ui.loadError.value = error instanceof Error ? error.message : String(error);
      return;
    }
    ui.enemyPortraits.value = this.capturePortraits();
    const world = this.deps.createWorld();
    this.world = world;
    world.onMerchantSignActivated(() => {
      this.visitMerchant();
    });
    world.onTrapSignActivated((cell) => {
      this.armTrap(cell);
    });
    effect(() => {
      const settings = this.deps.settings.current.value;
      world.applyQuality(settings.quality);
      world.setScreenShake(settings.screenShake);
      world.setCameraAimLead(settings.cameraAimLead);
      ui.touchControls.value = this.resolveTouchControls(settings.touchControls);
      world.setTouchMode(ui.touchControls.value);
    });
    effect(() => {
      const aiming =
        ui.screen.value === AppScreen.Game && !ui.paused.value && !ui.shopVisible.value;
      this.deps.gameSurface.style.cursor = aiming ? CROSSHAIR_CURSOR : '';
    });
    effect(() => {
      world.setMode(screenViewMode(ui.screen.value));
      world.setLineup(this.lineupFor(ui.screen.value));
    });
    ui.screen.value = AppScreen.MainMenu;
  }

  private capturePortraits(): ReadonlyMap<EnemyKind, string> {
    try {
      return this.deps.captureEnemyPortraits();
    } catch {
      return new Map();
    }
  }

  frame(nowMilliseconds: number, deltaSeconds: number): void {
    const worldFrame =
      this.session === null ? null : this.session.update(nowMilliseconds, deltaSeconds);
    this.refreshHud(deltaSeconds);
    this.trackFps(deltaSeconds);
    this.followListener(worldFrame);
    this.withWorld((world) => {
      world.setAimGuide(this.aimGuideMode());
      world.render(worldFrame, deltaSeconds, this.isNearMerchant(), this.offeredTrapCell());
    });
  }

  private aimGuideMode(): AimGuideMode {
    const session = this.session;
    if (session === null || !session.touch.isAiming) {
      return AimGuideMode.Hidden;
    }
    return session.touch.isFiring ? AimGuideMode.Firing : AimGuideMode.Aiming;
  }

  navigate(screen: AppScreen): void {
    if (screen === AppScreen.HeroSelect) {
      this.heroScreenReturn = this.deps.ui.screen.value;
      this.deps.ui.previewHero.value = this.currentHero();
    }
    this.deps.ui.screen.value = screen;
  }

  async createRoom(): Promise<void> {
    if (await this.identify()) {
      this.deps.net.send({ type: ClientMessageType.CreateRoom });
    }
  }

  async joinRoom(code: string): Promise<void> {
    if (await this.identify()) {
      this.deps.net.send({ type: ClientMessageType.JoinRoom, code: code.trim().toUpperCase() });
    }
  }

  leaveRoom(): void {
    this.deps.net.send({ type: ClientMessageType.LeaveRoom });
    this.deps.ui.room.value = null;
    this.deps.ui.screen.value = AppScreen.MainMenu;
  }

  previewHero(hero: HeroId): void {
    this.deps.ui.previewHero.value = hero;
  }

  confirmHero(hero: HeroId): void {
    this.deps.settings.update({ preferredHero: hero });
    if (this.deps.ui.room.value !== null) {
      this.deps.net.send({ type: ClientMessageType.SelectHero, hero });
    }
    this.deps.ui.screen.value = this.heroScreenReturn;
  }

  setReady(ready: boolean): void {
    this.deps.net.send({ type: ClientMessageType.SetReady, ready });
  }

  setBotCount(count: number): void {
    this.deps.net.send({ type: ClientMessageType.SetBotCount, count });
  }

  setMatchSettings(settings: MatchSettings): void {
    this.deps.net.send({ type: ClientMessageType.SetMatchSettings, settings });
  }

  purchase(offer: ShopOffer): void {
    this.deps.net.send({ type: ClientMessageType.Purchase, offer });
  }

  selectWeapon(weapon: WeaponId): void {
    this.deps.net.send({ type: ClientMessageType.SwitchWeapon, weapon });
  }

  selectWeaponSlot(slot: number): void {
    const weapon = this.ownedWeapons()[slot];
    if (weapon !== undefined) {
      this.selectWeapon(weapon);
    }
  }

  cycleWeapon(direction: number): void {
    const owned = this.ownedWeapons();
    const hud = this.deps.ui.hud.value;
    if (owned.length < 2 || hud === null) {
      return;
    }
    const current = hud.weapon;
    const index = owned.indexOf(current);
    const next = owned[(index + direction + owned.length) % owned.length];
    if (next !== undefined) {
      this.selectWeapon(next);
    }
  }

  reload(): void {
    this.withSession((session) => {
      session.touch.requestReload();
    });
  }

  togglePause(): void {
    if (this.deps.ui.shopVisible.value) {
      this.setShopVisible(false);
      return;
    }
    this.setPaused(!this.deps.ui.paused.value);
  }

  setPaused(paused: boolean): void {
    if (this.session === null || this.deps.ui.paused.value === paused) {
      return;
    }
    this.deps.ui.paused.value = paused;
    this.session.setPaused(paused);
    this.deps.net.send({ type: ClientMessageType.SetPaused, paused });
  }

  toggleShop(): void {
    const hud = this.deps.ui.hud.value;
    if (hud !== null && hud.trapSpot !== null) {
      this.armTrap(hud.trapSpot.index);
      return;
    }
    this.visitMerchant();
  }

  visitMerchant(): void {
    const hud = this.deps.ui.hud.value;
    if (hud !== null && hud.merchantAccess === MerchantAccess.Grave) {
      this.purchase({ kind: ShopOfferKind.ReviveMerchant });
      return;
    }
    if (hud !== null && hud.merchantAccess === MerchantAccess.Gone) {
      this.deps.notifier.error(
        this.text.notices.merchantDead,
        this.text.notices.merchantDeadHint(hud.merchantWavesAway, MERCHANT_RULES.revivePrice),
      );
      return;
    }
    if (!this.isServedByMerchant()) {
      this.deps.notifier.info(
        this.text.notices.shopAtMerchant,
        this.text.notices.shopAtMerchantHint,
        '⚰️',
      );
      return;
    }
    this.setShopVisible(!this.deps.ui.shopVisible.value);
  }

  armTrap(cell: number): void {
    this.deps.net.send({ type: ClientMessageType.ArmTrap, cell });
  }

  setShopVisible(visible: boolean): void {
    const wasVisible = this.deps.ui.shopVisible.value;
    this.deps.ui.shopVisible.value = visible && this.isServedByMerchant();
    if (wasVisible !== this.deps.ui.shopVisible.value) {
      this.deps.audio.cue(wasVisible ? SoundId.ShopClosed : SoundId.ShopOpened);
    }
    const inputEnabled = !this.deps.ui.shopVisible.value && !this.deps.ui.paused.value;
    this.withSession((session) => {
      session.setInputEnabled(inputEnabled);
    });
  }

  setScoreboardVisible(visible: boolean): void {
    this.deps.ui.scoreboardVisible.value = visible && this.session !== null;
  }

  voteSkipIntermission(): void {
    this.deps.net.send({ type: ClientMessageType.VoteSkipIntermission });
    this.setShopVisible(false);
    this.deps.notifier.info(this.text.notices.readyForWave, this.text.notices.waitingOthers, '🕯️');
  }

  leaveMatch(): void {
    this.reportMatchLeft();
    this.endSession();
    this.leaveRoom();
  }

  continueFromResults(): void {
    this.deps.ui.matchResult.value = null;
    this.deps.ui.screen.value =
      this.deps.ui.room.value === null ? AppScreen.MainMenu : AppScreen.Lobby;
  }

  updateSettings(patch: Partial<Settings>): void {
    this.deps.settings.update(patch);
  }

  resetProgress(): void {
    this.deps.progression.resetProgress();
    this.deps.notifier.info(this.text.notices.progressReset);
  }

  dismissToast(id: number): void {
    this.deps.notifier.dismiss(id);
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement === null) {
      document.documentElement.requestFullscreen().catch(() => {
        this.deps.notifier.error(this.text.notices.fullscreenUnavailable);
      });
      return;
    }
    document.exitFullscreen().catch(() => {
      this.deps.notifier.error(this.text.notices.fullscreenExitFailed);
    });
  }

  private async identify(): Promise<boolean> {
    const nickname = sanitizeNickname(this.deps.settings.current.value.nickname);
    if (nickname === null) {
      this.deps.notifier.error(this.text.notices.enterNickname, this.text.notices.nicknameRule);
      return false;
    }
    this.deps.ui.busy.value = true;
    try {
      this.deps.ui.localClientId.value = await this.deps.connection.ensureIdentified(nickname);
      return true;
    } catch (error: unknown) {
      const reason =
        error instanceof HandshakeError
          ? this.text.errors[error.code]
          : this.text.notices.serverUnavailable;
      this.deps.notifier.error(this.text.notices.connectFailed, reason);
      return false;
    } finally {
      this.deps.ui.busy.value = false;
    }
  }

  private subscribeToServer(): void {
    const messages = this.deps.net.messages;
    messages.on(ServerMessageType.RoomState, (message) => {
      this.onRoomState(message);
    });
    messages.on(ServerMessageType.MatchStarted, (message) => {
      this.onMatchStarted(message);
    });
    messages.on(ServerMessageType.Snapshot, (message) => {
      this.onSnapshot(message);
    });
    messages.on(ServerMessageType.ScoreboardUpdate, (message) => {
      this.withSession((session) => {
        for (const player of message.players) {
          session.scoreboard.set(player.playerId, player);
        }
      });
    });
    messages.on(ServerMessageType.LoadoutUpdate, (message) => {
      this.deps.ui.loadout.value = message.loadout;
    });
    messages.on(ServerMessageType.PurchaseRejected, (message) => {
      this.deps.audio.cue(SoundId.PurchaseRejected);
      this.deps.notifier.error(this.text.purchaseRejections[message.rejection]);
    });
    messages.on(ServerMessageType.MatchEnded, (message) => {
      this.onMatchEnded(message);
    });
    messages.on(ServerMessageType.ErrorNotice, (message) => {
      this.deps.notifier.error(this.text.errors[message.error]);
    });
    this.deps.connection.watch({
      wantsResume: () => this.deps.ui.room.value !== null,
      onReconnecting: (attempt) => {
        this.deps.ui.reconnectAttempt.value = attempt;
      },
      onResumed: () => {
        this.deps.ui.reconnectAttempt.value = null;
        this.deps.notifier.info(
          this.text.notices.reconnected,
          this.text.notices.reconnectedHint,
          '📶',
        );
      },
      onLost: () => {
        this.deps.ui.reconnectAttempt.value = null;
        this.onConnectionLost();
      },
    });
  }

  private subscribeToEvents(): void {
    this.deps.bus.on(ClientEventType.AchievementUnlocked, (event) => {
      const texts = this.text.achievementTexts[event.achievementId];
      this.deps.notifier.achievement(
        this.text.notices.achievement(texts.title),
        texts.description(achievementTarget(event.achievementId)),
        ACHIEVEMENT_ICONS[event.achievementId],
      );
      this.matchAchievements.push(event.achievementId);
    });
  }

  private onRoomState(message: RoomStateMessage): void {
    const ui = this.deps.ui;
    const firstJoin = ui.room.value === null || ui.room.value.code !== message.code;
    ui.room.value = message;
    if (firstJoin) {
      this.deps.net.send({
        type: ClientMessageType.SelectHero,
        hero: this.deps.settings.current.value.preferredHero,
      });
    }
    if (!message.inMatch && this.session !== null) {
      this.endSession();
      this.deps.notifier.error(this.text.notices.matchAborted);
      ui.screen.value = AppScreen.Lobby;
      return;
    }
    const idleScreens: readonly AppScreen[] = [
      AppScreen.MainMenu,
      AppScreen.Results,
      AppScreen.Lobby,
    ];
    if (
      !message.inMatch &&
      this.session === null &&
      idleScreens.includes(ui.screen.value) &&
      ui.matchResult.value === null
    ) {
      ui.screen.value = AppScreen.Lobby;
    }
  }

  private onMatchStarted(message: MatchStartedMessage): void {
    const localPlayerId = this.deps.ui.localClientId.value;
    const world = this.world;
    if (localPlayerId === null || world === null) {
      return;
    }
    this.endSession();
    this.deps.ui.matchSettings.value = message.settings;
    this.startSession(localPlayerId, world, message);
    if (message.resumed) {
      return;
    }
    this.matchAchievements = [];
    this.deps.bus.emit({ type: ClientEventType.MatchStarted, localPlayerId, mapId: message.mapId });
    this.deps.notifier.banner(this.text.notices.shiftStarts, this.text.notices.shiftStartsHint);
  }

  private startSession(
    localPlayerId: number,
    world: WorldRenderer,
    message: MatchStartedMessage,
  ): void {
    const nicknames = new Map(
      this.roomMembers().map((member) => [
        member.clientId,
        playerName(member.clientId, member.nickname, this.text),
      ]),
    );
    this.session = new GameSession({
      localPlayerId,
      mapId: message.mapId,
      nicknames,
      surface: this.deps.gameSurface,
      aimResolver: world,
      commands: this,
      send: (outgoing) => {
        this.deps.net.send(outgoing);
      },
      onEvent: (event) => {
        this.onGameEvent(event);
      },
    });
    world.setLocalPlayer(localPlayerId);
    this.deps.ui.activeTouch.value = this.session.touch;
    this.deps.ui.paused.value = false;
    this.deps.ui.shopVisible.value = false;
    this.deps.ui.hud.value = null;
    this.deps.ui.screen.value = AppScreen.Game;
  }

  private onSnapshot(message: SnapshotMessage): void {
    this.withSession((session) => {
      session.onSnapshot(message, performance.now());
    });
  }

  private onGameEvent(event: GameEvent): void {
    this.withWorld((world) => {
      world.handleEvent(event);
    });
    this.deps.bus.emit(event);
    if (event.type === GameEventType.WaveStarted) {
      this.setShopVisible(false);
      this.deps.notifier.banner(
        this.text.notices.wave(event.wave),
        isBossWave(event.wave)
          ? this.text.notices.bossIncoming
          : this.text.notices.waveOf(this.deps.ui.matchSettings.value.totalWaves),
      );
    } else if (
      event.type === GameEventType.WaveCleared &&
      !isFinalWave(event.wave, this.deps.ui.matchSettings.value.totalWaves)
    ) {
      this.deps.notifier.banner(this.text.notices.waveCleared, this.text.notices.waveClearedHint);
    } else if (event.type === GameEventType.MerchantKilled) {
      this.deps.notifier.banner(
        this.text.notices.merchantKilled,
        this.text.notices.merchantClosedFor(MERCHANT_RULES.absenceWaves),
      );
    } else if (event.type === GameEventType.MerchantReturned) {
      this.noticeMerchantReturned(event.reviverId);
    } else if (event.type === GameEventType.FuryUnleashed && this.isLocalPlayer(event.playerId)) {
      this.deps.notifier.banner(
        this.text.notices.furyUnleashed,
        this.text.notices.furyUnleashedHint(
          MELEE_RULES.furySeconds,
          MELEE_RULES.furyDamageMultiplier,
        ),
      );
    } else if (event.type === GameEventType.TrapSprung && event.playerId !== null) {
      if (this.isLocalPlayer(event.playerId)) {
        this.deps.notifier.info(this.text.notices.snared, this.text.notices.snaredHint, '🪤');
      }
    } else if (event.type === GameEventType.PlayerDamaged && event.attackerId !== null) {
      this.noticeFriendlyFire(event.playerId, event.attackerId);
    }
  }

  private noticeMerchantReturned(reviverId: number | null): void {
    const session = this.session;
    if (reviverId === null || session === null) {
      this.deps.notifier.banner(this.text.notices.merchantBack, this.text.notices.merchantBackHint);
      return;
    }
    this.deps.notifier.banner(
      this.text.notices.merchantRevived(session.nicknames.get(reviverId) ?? `#${reviverId}`),
      this.text.notices.merchantBackHint,
    );
  }

  private isLocalPlayer(playerId: number): boolean {
    return this.session !== null && this.session.localPlayerId === playerId;
  }

  private isNearMerchant(): boolean {
    const hud = this.deps.ui.hud.value;
    return (
      hud !== null &&
      hud.trapSpot === null &&
      (hud.merchantAccess === MerchantAccess.Serving || hud.merchantAccess === MerchantAccess.Grave)
    );
  }

  private offeredTrapCell(): number | null {
    const hud = this.deps.ui.hud.value;
    return hud === null || hud.trapSpot === null ? null : hud.trapSpot.index;
  }

  private isServedByMerchant(): boolean {
    const hud = this.deps.ui.hud.value;
    return hud !== null && hud.merchantAccess === MerchantAccess.Serving;
  }

  private noticeFriendlyFire(victimId: number, attackerId: number): void {
    const localId = this.session === null ? null : this.session.localPlayerId;
    const now = performance.now();
    if (victimId === attackerId) {
      return;
    }
    if (now - this.lastFriendlyFireNotice < FRIENDLY_FIRE_NOTICE_MILLISECONDS) {
      return;
    }
    if (attackerId === localId) {
      this.lastFriendlyFireNotice = now;
      this.deps.notifier.error(this.text.notices.friendlyFire, this.text.notices.friendlyFireHint);
    } else if (victimId === localId) {
      this.lastFriendlyFireNotice = now;
      this.deps.notifier.error(this.text.notices.shotByAlly);
    }
  }

  private onMatchEnded(message: MatchEndedMessage): void {
    const session = this.session;
    if (session === null) {
      return;
    }
    this.deps.bus.emit({
      type: ClientEventType.MatchFinished,
      localPlayerId: session.localPlayerId,
      outcome: message.outcome,
      wave: message.wave,
      durationTicks: message.durationTicks,
      stats: message.stats,
    });
    this.deps.ui.matchResult.value = {
      outcome: message.outcome,
      wave: message.wave,
      durationSeconds: Math.round(message.durationTicks / SIMULATION.tickRate),
      totalWaves: this.deps.ui.matchSettings.value.totalWaves,
      stats: message.stats,
      localPlayerId: session.localPlayerId,
      unlockedAchievements: [...this.matchAchievements],
    };
    this.endSession();
    this.deps.ui.screen.value =
      message.outcome === MatchOutcome.Abandoned ? AppScreen.Lobby : AppScreen.Results;
  }

  private onConnectionLost(): void {
    const ui = this.deps.ui;
    const wasActive = ui.room.value !== null || this.session !== null;
    this.reportMatchLeft();
    this.endSession();
    ui.room.value = null;
    ui.localClientId.value = null;
    if (wasActive) {
      this.deps.notifier.error(this.text.notices.connectionLost);
      ui.screen.value = AppScreen.MainMenu;
    }
  }

  private withSession(action: (session: GameSession) => void): void {
    if (this.session !== null) {
      action(this.session);
    }
  }

  private withWorld(action: (world: WorldRenderer) => void): void {
    if (this.world !== null) {
      action(this.world);
    }
  }

  private roomMembers(): readonly RoomMemberInfo[] {
    const room = this.deps.ui.room.value;
    return room === null ? [] : room.members;
  }

  private reportMatchLeft(): void {
    if (this.session !== null) {
      this.deps.bus.emit({ type: ClientEventType.MatchLeft });
    }
  }

  private endSession(): void {
    this.withSession((session) => {
      session.dispose();
    });
    this.session = null;
    this.deps.ui.activeTouch.value = null;
    this.withWorld((world) => {
      world.setLocalPlayer(null);
    });
    this.deps.ui.paused.value = false;
    this.deps.ui.shopVisible.value = false;
    this.deps.ui.scoreboardVisible.value = false;
    this.deps.ui.hud.value = null;
    this.deps.ui.loadout.value = null;
  }

  private refreshHud(deltaSeconds: number): void {
    this.hudCooldown -= deltaSeconds;
    const session = this.session;
    if (this.hudCooldown > 0 || session === null) {
      return;
    }
    const snapshot = session.match.latestSnapshot;
    if (snapshot === undefined) {
      return;
    }
    this.hudCooldown = HUD_REFRESH_SECONDS;
    const ui = this.deps.ui;
    const wasReloading = ui.hud.value !== null && ui.hud.value.reloading;
    const hud = buildHud(
      snapshot,
      session.localPlayerId,
      session.nicknames,
      ui.loadout.value,
      session.scoreboard,
      session.match.trapSpots,
    );
    ui.hud.value = hud;
    if (hud !== null && hud.reloading && !wasReloading) {
      this.deps.audio.cue(SoundId.Reload);
    }
    if (ui.shopVisible.value && !this.isServedByMerchant()) {
      this.setShopVisible(false);
    }
  }

  private followListener(worldFrame: WorldFrame | null): void {
    const session = this.session;
    if (worldFrame === null || session === null) {
      return;
    }
    const local = worldFrame.players.find((player) => player.id === session.localPlayerId);
    if (local !== undefined) {
      this.deps.audio.setListener(local.x, local.y);
    }
  }

  private trackFps(deltaSeconds: number): void {
    this.fpsFrames += 1;
    this.fpsElapsed += deltaSeconds;
    if (this.fpsElapsed >= FPS_SAMPLE_SECONDS) {
      this.deps.ui.fps.value = Math.round(this.fpsFrames / this.fpsElapsed);
      this.withWorld((world) => {
        this.deps.ui.drawCalls.value = world.stats.drawCalls;
        this.deps.ui.triangles.value = world.stats.triangles;
      });
      this.fpsFrames = 0;
      this.fpsElapsed = 0;
    }
  }

  private ownedWeapons(): readonly RangedWeaponId[] {
    const hud = this.deps.ui.hud.value;
    return hud === null ? [STARTING_RANGED_WEAPON] : hud.ownedWeapons;
  }

  private currentHero(): HeroId {
    const ui = this.deps.ui;
    const member = this.roomMembers().find(
      (candidate) => candidate.clientId === ui.localClientId.value,
    );
    return member === undefined ? this.deps.settings.current.value.preferredHero : member.hero;
  }

  private lineupFor(screen: AppScreen): readonly HeroId[] {
    const ui = this.deps.ui;
    switch (screen) {
      case AppScreen.HeroSelect:
        return [ui.previewHero.value];
      case AppScreen.Lobby:
        return this.roomMembers().map((member) => member.hero);
      case AppScreen.Results:
        return ui.matchResult.value === null
          ? EMPTY_LINEUP
          : ui.matchResult.value.stats.map((stats) => stats.hero);
      default:
        return EMPTY_LINEUP;
    }
  }

  private resolveTouchControls(mode: TouchControlsMode): boolean {
    switch (mode) {
      case TouchControlsMode.Always:
        return true;
      case TouchControlsMode.Never:
        return false;
      case TouchControlsMode.Auto:
        return window.matchMedia('(pointer: coarse)').matches;
    }
  }
}
