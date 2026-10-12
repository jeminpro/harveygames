import { rustwingMarkup } from "./markup";

const FIELDS = ["#7eac4a", "#d2ae55", "#6b9a42", "#c48a4a", "#8fba58", "#5f8c3e"];
const WHEAT = new Set([1, 3]);

type UpgradeId = "wing" | "wheel" | "prop" | "pouch" | "stick";
type PlaneId = "wreck" | "barn" | "night" | "dart";
type ShopId = UpgradeId | Exclude<PlaneId, "wreck">;

const UPGRADES: Array<{ id: UpgradeId; name: string; detail: string; price: number }> = [
  { id: "wing", name: "Patched wing", detail: "The nose climbs faster.", price: 40 },
  { id: "wheel", name: "Spare wheel", detail: "You start higher, with a longer safe start.", price: 60 },
  { id: "stick", name: "Steady stick", detail: "More control. Up and Down swing the nose faster.", price: 120 },
  { id: "prop", name: "Fresh propeller", detail: "Fly faster, so the countryside pays sooner.", price: 100 },
  { id: "pouch", name: "Deep pockets", detail: "Coins in the sky are worth double.", price: 140 },
];

const PLANES: Array<{ id: PlaneId; name: string; detail: string; price: number }> = [
  { id: "wreck", name: "The wreck", detail: "Bent, patched, and already yours.", price: 0 },
  { id: "barn", name: "Barnstormer", detail: "A red biplane with two wings.", price: 180 },
  { id: "night", name: "Night bird", detail: "A long dark plane with a swept wing.", price: 260 },
  { id: "dart", name: "Lime dart", detail: "A sharp racer in acid lime.", price: 340 },
];

function isShopId(id: string): id is ShopId {
  return UPGRADES.some((item) => item.id === id) || (id !== "wreck" && PLANES.some((item) => item.id === id));
}

function isPlaneId(id: string): id is PlaneId {
  return PLANES.some((item) => item.id === id);
}

type Mode = "menu" | "playing" | "crashed";
type ObstacleKind = "tree" | "barn" | "windmill" | "bale";

type Obstacle = {
  kind: ObstacleKind;
  x: number;
  w: number;
  h: number;
};

type Pickup = {
  x: number;
  lift: number;
  taken: boolean;
};

type Puff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
  color: string;
};

type View = {
  width: number;
  height: number;
  resolution: number;
};

type RustwingOptions = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  onExit: () => void;
  getView: () => View;
};

type Refs = {
  menu: HTMLElement;
  hud: HTMLElement;
  dialog: HTMLElement;
  coins: HTMLElement;
  coinLabel: HTMLElement;
  distance: HTMLElement;
  rate: HTMLElement;
  hint: HTMLElement;
  dialogEarned: HTMLElement;
  dialogCoins: HTMLElement;
  dialogDistance: HTMLElement;
  start: HTMLButtonElement;
  market: HTMLButtonElement;
  again: HTMLButtonElement;
  menuReturn: HTMLButtonElement;
  shop: HTMLElement;
  shopList: HTMLElement;
  shopClose: HTMLButtonElement;
  cabinetHome: HTMLButtonElement;
  brand: HTMLButtonElement;
  pitchControls: HTMLElement;
  pitchUp: HTMLButtonElement;
  pitchDown: HTMLButtonElement;
};

function wave(x: number) {
  const n =
    Math.sin(x * 0.00105) * 0.34 +
    Math.sin(x * 0.00033 + 0.8) * 0.46 +
    Math.sin(x * 0.0031) * 0.2;
  return (n + 1) / 2;
}

function groundBand(viewH: number) {
  // Short screens, especially phones in landscape, keep a low horizon.
  const share = viewH < 700 ? 0.2 + (viewH / 700) * 0.08 : 0.28;
  const ceiling = Math.min(viewH * share, 240);
  const base = Math.min(Math.max(18, viewH * 0.045), ceiling * 0.38);
  return { base, lift: Math.max(14, ceiling - base) };
}

function terrain(x: number, viewH: number) {
  const band = groundBand(viewH);
  return band.base + wave(x) * band.lift;
}

function hill(x: number, amp: number) {
  const n = Math.sin(x * 0.00042) * 0.62 + Math.sin(x * 0.00015 + 1.4) * 0.38;
  return ((n + 1) / 2) * amp;
}

function formatDistance(px: number) {
  const meters = Math.floor(px / 8);
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function circleHitsRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function must<T extends Element>(root: ParentNode, id: string) {
  const node = root.querySelector<T>(`#${id}`);
  if (!node) throw new Error(`Rustwing is missing #${id}.`);
  return node;
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, 38 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 30 * scale, y + 4, 26 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 28 * scale, y + 6, 22 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  prop: number,
  blade: string,
  hub: string,
  reach = 28,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(prop);
  ctx.fillStyle = blade;
  ctx.fillRect(-2.4, -reach, 4.8, reach * 2);
  ctx.restore();
  ctx.fillStyle = hub;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarn(ctx: CanvasRenderingContext2D, prop: number) {
  ctx.fillStyle = "#8e1d1d";
  ctx.beginPath();
  ctx.moveTo(-52, 0);
  ctx.lineTo(-34, -2);
  ctx.lineTo(-36, -18);
  ctx.lineTo(-54, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c5332a";
  ctx.beginPath();
  ctx.ellipse(0, 2, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2e2c4";
  ctx.beginPath();
  ctx.moveTo(-16, 8);
  ctx.lineTo(18, 10);
  ctx.lineTo(22, 18);
  ctx.lineTo(-8, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(-22, -22, 40, 8);
  ctx.fillStyle = "#c5332a";
  ctx.fillRect(-22, -20, 40, 2);
  ctx.strokeStyle = "#2a1c16";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.lineTo(-6, 8);
  ctx.moveTo(10, -14);
  ctx.lineTo(12, 9);
  ctx.stroke();
  ctx.fillStyle = "#1c242c";
  ctx.beginPath();
  ctx.ellipse(-4, -4, 8, 5, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#f0d36a";
  ctx.beginPath();
  ctx.ellipse(28, 2, 10, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  drawProp(ctx, 38, 2, prop, "#241c18", "#f7edd4");
  ctx.strokeStyle = "#3a2a22";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(-4, 22);
  ctx.moveTo(12, 12);
  ctx.lineTo(14, 22);
  ctx.stroke();
  ctx.fillStyle = "#1a1614";
  ctx.beginPath();
  ctx.arc(-4, 24, 4.5, 0, Math.PI * 2);
  ctx.arc(14, 24, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawNight(ctx: CanvasRenderingContext2D, prop: number) {
  ctx.fillStyle = "#141c2a";
  ctx.beginPath();
  ctx.moveTo(-58, 0);
  ctx.lineTo(-36, -1);
  ctx.lineTo(-40, -20);
  ctx.lineTo(-62, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2a3850";
  ctx.beginPath();
  ctx.ellipse(-2, 1, 42, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e0b15a";
  ctx.fillRect(-30, 3, 48, 2.5);
  ctx.fillStyle = "#121a28";
  ctx.beginPath();
  ctx.moveTo(-14, 6);
  ctx.lineTo(16, 4);
  ctx.lineTo(6, 22);
  ctx.lineTo(-24, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#9fd7ea";
  ctx.beginPath();
  ctx.ellipse(4, -6, 14, 7, 0.1, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#101820";
  ctx.beginPath();
  ctx.moveTo(22, -6);
  ctx.lineTo(40, 1);
  ctx.lineTo(22, 8);
  ctx.closePath();
  ctx.fill();
  drawProp(ctx, 40, 1, prop, "#0e1218", "#d7dde6", 16);
}

function drawDart(ctx: CanvasRenderingContext2D, prop: number) {
  ctx.fillStyle = "#16300e";
  ctx.beginPath();
  ctx.moveTo(-56, 1);
  ctx.lineTo(-34, -1);
  ctx.lineTo(-38, -18);
  ctx.lineTo(-60, -12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c8f542";
  ctx.beginPath();
  ctx.ellipse(-2, 2, 40, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9bc63a";
  ctx.beginPath();
  ctx.moveTo(-18, 6);
  ctx.lineTo(20, 4);
  ctx.lineTo(4, 24);
  ctx.lineTo(-28, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#10240f";
  ctx.beginPath();
  ctx.ellipse(8, -4, 12, 6, 0.1, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#eaff9a";
  ctx.beginPath();
  ctx.moveTo(24, -4);
  ctx.lineTo(40, 2);
  ctx.lineTo(24, 8);
  ctx.closePath();
  ctx.fill();
  drawProp(ctx, 40, 2, prop, "#1a2410", "#f4ffe0", 16);
}

function drawPlane(ctx: CanvasRenderingContext2D, prop: number, plane: PlaneId) {
  if (plane === "barn") {
    drawBarn(ctx, prop);
    return;
  }
  if (plane === "night") {
    drawNight(ctx, prop);
    return;
  }
  if (plane === "dart") {
    drawDart(ctx, prop);
    return;
  }

  ctx.fillStyle = "#cbb79a";
  ctx.beginPath();
  ctx.moveTo(-58, 1);
  ctx.lineTo(-36, 0);
  ctx.lineTo(-38, -16);
  ctx.lineTo(-54, -15);
  ctx.lineTo(-49, -7);
  ctx.lineTo(-60, -12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#9a5530";
  ctx.fillRect(-52, -5, 9, 4);

  ctx.fillStyle = "#b18462";
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.lineTo(16, 5);
  ctx.lineTo(24, 15);
  ctx.lineTo(8, 18);
  ctx.lineTo(-2, 12);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3c342c";
  ctx.beginPath();
  ctx.ellipse(6, 12, 5, 3.2, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e6d3b0";
  ctx.beginPath();
  ctx.ellipse(-2, 0, 38, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6a5142";
  ctx.fillRect(6, -5, 13, 8);
  ctx.fillStyle = "#a85a32";
  ctx.fillRect(-18, 3, 20, 3);
  ctx.fillRect(0, -8, 11, 3);
  ctx.fillStyle = "#f4e7cb";
  ctx.fillRect(-20, -7, 13, 8);
  ctx.strokeStyle = "#8d6a44";
  ctx.lineWidth = 1;
  ctx.strokeRect(-20, -7, 13, 8);

  ctx.fillStyle = "#24384a";
  ctx.beginPath();
  ctx.ellipse(-8, -6, 9, 6, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#d5e7f2";
  ctx.beginPath();
  ctx.moveTo(-12, -10);
  ctx.lineTo(-5, -6);
  ctx.lineTo(-8, -3);
  ctx.stroke();

  ctx.fillStyle = "#8d4e2e";
  ctx.beginPath();
  ctx.ellipse(30, 1, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(38, 1);
  ctx.rotate(prop);
  ctx.fillStyle = "#241f1c";
  ctx.fillRect(-2.5, -28, 5, 56);
  ctx.restore();
  ctx.fillStyle = "#efe0c8";
  ctx.beginPath();
  ctx.arc(38, 1, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#4a4038";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(-10, 22);
  ctx.stroke();
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.arc(-10, 25, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6b5344";
  ctx.beginPath();
  ctx.moveTo(14, 11);
  ctx.lineTo(18, 19);
  ctx.stroke();
}

export class RustwingSession {
  private readonly refs: Refs;
  private readonly reducedMotion: boolean;
  private mode: Mode = "menu";
  private w = 1280;
  private h = 720;
  private dpr = 1;
  private time = 0;
  private cameraX = 0;
  private planeY = 280;
  private vy = 0;
  private prop = 0;
  private anchor = 0.72;
  private speed = 250;
  private distance = 0;
  private wallet = 0;
  private unsavedEarn = 0;
  private unsavedSpend = 0;
  private plane: PlaneId = "wreck";
  private planeChosen = false;
  private runCoins = 0;
  private coinMeter = 0;
  private readonly owned = new Set<ShopId>();
  private grace = 0;
  private clearUntil = 0;
  private frontier = 0;
  private seed = 1;
  private held = false;
  private pitchHold: "up" | "down" | null = null;
  private pitch = 0;
  private crashedTilt = 0;
  private shownCoins = -1;
  private shownDistance = "";
  private readonly keys = new Set<string>();
  private readonly obstacles: Obstacle[] = [];
  private readonly pickups: Pickup[] = [];
  private readonly smoke: Puff[] = [];
  private disposed = false;

  constructor(private readonly options: RustwingOptions) {
    this.reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.options.root.innerHTML = rustwingMarkup;
    this.refs = {
      menu: must(this.options.root, "menu"),
      hud: must(this.options.root, "hud"),
      dialog: must(this.options.root, "dialog"),
      coins: must(this.options.root, "coins"),
      coinLabel: must(this.options.root, "coinLabel"),
      distance: must(this.options.root, "distance"),
      rate: must(this.options.root, "rate"),
      hint: must(this.options.root, "hint"),
      dialogEarned: must(this.options.root, "dialogEarned"),
      dialogCoins: must(this.options.root, "dialogCoins"),
      dialogDistance: must(this.options.root, "dialogDistance"),
      start: must(this.options.root, "start"),
      market: must(this.options.root, "market"),
      again: must(this.options.root, "again"),
      menuReturn: must(this.options.root, "menuReturn"),
      shop: must(this.options.root, "shop"),
      shopList: must(this.options.root, "shopList"),
      shopClose: must(this.options.root, "shopClose"),
      cabinetHome: must(this.options.root, "cabinetHome"),
      brand: must(this.options.root, "brand"),
      pitchControls: must(this.options.root, "pitchControls"),
      pitchUp: must(this.options.root, "pitchUp"),
      pitchDown: must(this.options.root, "pitchDown"),
    };
    this.bind();
    this.boot();
  }

  step(deltaMs: number) {
    if (this.disposed) return;
    this.readView();
    if (this.w < 2 || this.h < 2) return;
    const dt = Math.min(Math.max(deltaMs, 0) / 1000, 0.04);
    this.time += dt;
    this.ensureWorld();

    if (this.mode === "menu") {
      this.cameraX += (this.reducedMotion ? 12 : 32) * dt;
      this.anchor += (0.72 - this.anchor) * Math.min(1, dt * 3);
      const hover = this.h * 0.3 + Math.sin(this.time * 1.3) * 14;
      this.planeY += (hover - this.planeY) * Math.min(1, dt * 2);
      this.pitch += (Math.sin(this.time * 1.3) * 0.12 - this.pitch) * Math.min(1, dt * 2);
      this.prop += dt * (this.reducedMotion ? 6 : 16);
      this.emitSmoke(dt, 16);
      this.driftSmoke(dt);
      return;
    }

    if (this.mode === "crashed") {
      this.prop += dt * 4;
      this.crashedTilt = Math.min(0.9, this.crashedTilt + dt * 0.8);
      this.emitSmoke(dt, 16);
      this.driftSmoke(dt);
      return;
    }

    const stick = this.owned.has("stick");
    const climb = this.held || this.pitchHold === "up" || this.keys.has("arrowup") || this.keys.has("w") || this.keys.has(" ");
    const dive = !climb && (this.pitchHold === "down" || this.keys.has("arrowdown") || this.keys.has("s"));
    let ay = stick ? 160 : 460;
    if (climb) ay -= (this.owned.has("wing") ? 1500 : 1180) * (stick ? 1.35 : 1);
    if (dive) ay += stick ? 980 : 640;
    this.vy = clamp(this.vy + ay * dt, stick ? -480 : -360, stick ? 560 : 460);
    this.planeY = clamp(this.planeY + this.vy * dt, 28, this.h - 20);
    const targetPitch = climb ? -0.78 : dive ? 0.82 : 0.06;
    const pitchFollow = this.reducedMotion ? 18 : stick ? 26 : 9;
    this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * pitchFollow);
    this.refs.pitchUp.setAttribute("aria-pressed", String(climb));
    this.refs.pitchDown.setAttribute("aria-pressed", String(dive));
    this.anchor += (0.3 - this.anchor) * Math.min(1, dt * 3);
    const speedBonus = this.owned.has("prop") ? 90 : 0;
    this.speed = Math.min(500, 250 + speedBonus + this.distance / 80);
    this.cameraX += this.speed * dt;
    this.distance += this.speed * dt;
    this.prop += dt * (this.reducedMotion ? 8 : 22 + this.speed / 50);
    this.grace = Math.max(0, this.grace - dt);
    this.payCoins(dt);
    this.collectCoins();
    if (this.grace <= 0) this.checkCrash();
    this.emitSmoke(dt, 10 + this.speed / 80);
    this.driftSmoke(dt);
    this.paintHud();
    this.refs.hint.classList.toggle("hidden", this.grace <= 0);
  }

  render() {
    if (this.disposed) return;
    this.readView();
    if (this.w < 2 || this.h < 2) return;
    const ctx = this.options.context;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    this.drawSky(ctx);
    this.drawClouds(ctx);
    this.drawHills(ctx);
    this.drawBirds(ctx);
    this.drawFields(ctx);
    this.drawDecor(ctx);
    this.drawObstacles(ctx);
    this.drawPickups(ctx);
    this.drawSmoke(ctx);
    this.drawShadow(ctx);
    this.drawAircraft(ctx);
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.options.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  private bind() {
    this.refs.start.onclick = () => this.start();
    this.refs.market.onclick = () => this.openShop();
    this.refs.shopClose.onclick = () => this.closeShop();
    this.refs.again.onclick = () => this.start();
    this.refs.menuReturn.onclick = () => this.showMenu();
    this.refs.brand.onclick = () => {
      if (this.mode !== "menu") this.showMenu();
    };
    this.refs.cabinetHome.onclick = () => this.options.onExit();
    this.bindPitch(this.refs.pitchUp, "up");
    this.bindPitch(this.refs.pitchDown, "down");
    this.options.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  private boot() {
    try {
      const savedWallet = localStorage.getItem("rustwing-wallet");
      if (savedWallet === null) {
        this.wallet = Number(localStorage.getItem("rustwing-best")) || 0;
        this.saveProgress();
      } else {
        this.wallet = Number(savedWallet) || 0;
      }
      const owned = localStorage.getItem("rustwing-owned") ?? "";
      for (const id of owned.split(",")) {
        if (isShopId(id)) this.owned.add(id);
      }
      const savedPlane = localStorage.getItem("rustwing-plane");
      if (savedPlane && this.canFly(savedPlane)) this.plane = savedPlane;
    } catch {
      this.wallet = 0;
    }
    this.showMenu();
  }

  private readView() {
    const view = this.options.getView();
    this.w = view.width;
    this.h = view.height;
    this.dpr = view.resolution || 1;
    const canvas = this.options.canvas;
    const nextW = Math.max(1, Math.round(this.w * this.dpr));
    const nextH = Math.max(1, Math.round(this.h * this.dpr));
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
    }
  }

  private groundTop(worldX: number) {
    return this.h - terrain(worldX, this.h);
  }

  private planeScreenX() {
    return this.w * this.anchor;
  }

  private planeWorldX() {
    return this.cameraX + this.planeScreenX();
  }

  private rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  private showMenu() {
    this.mode = "menu";
    this.held = false;
    this.pitchHold = null;
    this.releasePitch();
    this.keys.clear();
    this.vy = 0;
    this.options.root.classList.remove("in-flight");
    this.refs.menu.classList.remove("hidden");
    this.refs.hud.classList.add("hidden");
    this.refs.pitchControls.classList.add("hidden");
    this.refs.dialog.classList.add("hidden");
    this.closeShop();
    this.refs.coinLabel.textContent = "Coins";
    this.shownCoins = -1;
    this.paintHud();
  }

  private start() {
    if (this.disposed) return;
    this.mode = "playing";
    this.distance = 0;
    this.runCoins = 0;
    this.coinMeter = 0;
    this.vy = 0;
    this.grace = this.owned.has("wheel") ? 3.2 : 1.8;
    this.crashedTilt = 0;
    this.shownCoins = -1;
    this.shownDistance = "";
    this.held = false;
    this.pitchHold = null;
    this.pitch = -0.2;
    this.releasePitch();
    this.keys.clear();
    const nose = this.planeWorldX();
    this.clearUntil = nose + 760;
    this.obstacles.splice(
      0,
      this.obstacles.length,
      ...this.obstacles.filter((obstacle) => obstacle.x > nose + 680),
    );
    const ground = this.groundTop(nose);
    const clearance = this.owned.has("wheel") ? 230 : 160;
    this.planeY = Math.max(56, Math.min(ground - clearance, this.h * (this.owned.has("wheel") ? 0.32 : 0.4)));
    this.options.root.classList.add("in-flight");
    this.refs.menu.classList.add("hidden");
    this.refs.dialog.classList.add("hidden");
    this.closeShop();
    this.refs.hud.classList.remove("hidden");
    this.refs.pitchControls.classList.remove("hidden");
    this.refs.hint.classList.remove("hidden");
    this.refs.coinLabel.textContent = "Coins";
    this.shownCoins = -1;
    this.refs.rate.textContent = "Coins for every stretch you stay up.";
    this.paintHud();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  private crash() {
    if (this.mode !== "playing") return;
    this.mode = "crashed";
    this.held = false;
    this.pitchHold = null;
    this.releasePitch();
    this.keys.clear();
    this.saveProgress();
    this.refs.pitchControls.classList.add("hidden");
    this.refs.dialogEarned.textContent = String(this.runCoins);
    this.refs.dialogDistance.textContent = formatDistance(this.distance);
    this.refs.dialogCoins.textContent = String(this.wallet);
    this.refs.dialog.classList.remove("hidden");
    this.refs.again.focus();
  }

  private canFly(id: string): id is PlaneId {
    return isPlaneId(id) && (id === "wreck" || this.owned.has(id));
  }

  private rememberOwned() {
    const stored = localStorage.getItem("rustwing-owned") ?? "";
    for (const id of stored.split(",")) {
      if (isShopId(id)) this.owned.add(id);
    }
  }

  private saveProgress() {
    try {
      this.rememberOwned();
      const storedPlane = localStorage.getItem("rustwing-plane");
      if (!this.planeChosen && storedPlane && this.canFly(storedPlane)) this.plane = storedPlane;
      if (!this.canFly(this.plane)) this.plane = "wreck";
      const raw = localStorage.getItem("rustwing-wallet");
      const stored = raw === null ? this.wallet : Number(raw) || 0;
      const next = Math.max(0, stored + this.unsavedEarn - this.unsavedSpend);
      this.unsavedEarn = 0;
      this.unsavedSpend = 0;
      this.wallet = next;
      localStorage.setItem("rustwing-wallet", String(this.wallet));
      localStorage.setItem("rustwing-owned", [...this.owned].join(","));
      localStorage.setItem("rustwing-plane", this.plane);
    } catch {
      // The coins still count for this visit.
    }
  }

  private addCoins(amount: number) {
    if (amount <= 0) return;
    this.runCoins += amount;
    this.wallet += amount;
    this.unsavedEarn += amount;
    this.saveProgress();
  }

  private openShop() {
    if (this.mode !== "menu") return;
    this.renderShop();
    this.refs.shop.classList.remove("hidden");
    this.refs.shopClose.focus({ preventScroll: true });
    this.refs.shop.querySelector(".shop-card")?.scrollTo(0, 0);
  }

  private closeShop() {
    this.refs.shop.classList.add("hidden");
  }

  private renderShop() {
    this.refs.shopList.replaceChildren();
    this.appendShopLabel("Airplanes");
    for (const item of PLANES) this.appendPlane(item);
    this.appendShopLabel("Parts");
    for (const item of UPGRADES) this.appendUpgrade(item);
  }

  private appendShopLabel(text: string) {
    const row = document.createElement("li");
    row.className = "shop-label";
    row.textContent = text;
    this.refs.shopList.append(row);
  }

  private appendUpgrade(item: (typeof UPGRADES)[number]) {
    const owned = this.owned.has(item.id);
    this.appendShopRow(item.name, item.detail, (button) => {
      if (owned) {
        button.textContent = "Owned";
        button.disabled = true;
        return;
      }
      button.textContent = String(item.price);
      button.disabled = this.wallet < item.price;
      button.setAttribute("aria-label", `Buy ${item.name} for ${item.price} coins`);
      button.onclick = () => this.buy(item.id);
    });
  }

  private appendPlane(item: (typeof PLANES)[number]) {
    const owned = item.id === "wreck" || this.owned.has(item.id);
    const flying = this.plane === item.id;
    this.appendShopRow(item.name, item.detail, (button) => {
      if (flying) {
        button.textContent = "Flying";
        button.disabled = true;
        return;
      }
      if (owned) {
        button.textContent = "Fly this";
        button.setAttribute("aria-label", `Fly the ${item.name}`);
        button.onclick = () => this.flyPlane(item.id);
        return;
      }
      button.textContent = String(item.price);
      button.disabled = this.wallet < item.price;
      button.setAttribute("aria-label", `Buy ${item.name} for ${item.price} coins`);
      button.onclick = () => {
        if (item.id !== "wreck") this.buy(item.id);
      };
    });
  }

  private appendShopRow(title: string, detailText: string, fill: (button: HTMLButtonElement) => void) {
    const row = document.createElement("li");
    const copy = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = title;
    const detail = document.createElement("small");
    detail.textContent = detailText;
    copy.append(name, detail);
    const button = document.createElement("button");
    button.type = "button";
    fill(button);
    row.append(copy, button);
    this.refs.shopList.append(row);
  }

  private buy(id: ShopId) {
    const item = [...UPGRADES, ...PLANES].find((entry) => entry.id === id);
    if (!item || item.price <= 0 || this.owned.has(id) || this.wallet < item.price) return;
    this.wallet -= item.price;
    this.unsavedSpend += item.price;
    this.owned.add(id);
    if (isPlaneId(id)) {
      this.plane = id;
      this.planeChosen = true;
    }
    this.saveProgress();
    this.shownCoins = -1;
    this.paintHud();
    this.renderShop();
  }

  private flyPlane(id: PlaneId) {
    if (!this.canFly(id) || this.plane === id) return;
    this.plane = id;
    this.planeChosen = true;
    this.saveProgress();
    this.renderShop();
  }

  private payCoins(dt: number) {
    const pay = 2.1 + Math.min(9, this.distance / 3500);
    this.coinMeter += dt * pay;
    const whole = Math.floor(this.coinMeter);
    if (whole <= 0) return;
    this.coinMeter -= whole;
    this.addCoins(whole);
    if (this.distance > 9000) this.refs.rate.textContent = "The long flight is paying off.";
    else if (this.distance > 2500) this.refs.rate.textContent = "Farther pays a little faster.";
  }

  private collectCoins() {
    const px = this.planeWorldX();
    const py = this.planeY;
    for (const coin of this.pickups) {
      if (coin.taken) continue;
      const sx = coin.x - this.cameraX;
      const sy = this.groundTop(coin.x) - coin.lift;
      if (Math.hypot(sx - this.planeScreenX(), sy - py) > 28) continue;
      coin.taken = true;
      this.addCoins(this.owned.has("pouch") ? 30 : 15);
      this.burst(this.planeScreenX() + 16, py, "240, 200, 74");
    }
  }

  private checkCrash() {
    const px = this.planeScreenX();
    const py = this.planeY;
    if (py + 14 > this.groundTop(this.planeWorldX())) {
      this.crash();
      return;
    }
    for (const obstacle of this.obstacles) {
      const left = obstacle.x - this.cameraX;
      const ground = this.groundTop(obstacle.x + obstacle.w / 2);
      const top = ground - obstacle.h;
      if (circleHitsRect(px, py, 15, left, top, obstacle.w, obstacle.h)) {
        this.crash();
        return;
      }
      if (obstacle.kind === "windmill") {
        const hx = left + obstacle.w / 2;
        const hy = top + 8;
        if (Math.hypot(px - hx, py - hy) < 52) {
          this.crash();
          return;
        }
      }
    }
  }

  private makePickup(x: number): Pickup {
    const ground = this.groundTop(x);
    const lift = Math.min(80 + this.rand() * 150, Math.max(64, ground - 56));
    return { x, lift, taken: false };
  }

  private ensureWorld() {
    const ahead = this.cameraX + this.w + 640;
    while (this.frontier < ahead) {
      const gap = 440 + this.rand() * 340;
      this.frontier += gap;
      const x = this.frontier;
      this.pickups.push(this.makePickup(x - gap * 0.55));
      if (this.distance > 4000 && this.rand() < 0.75) this.pickups.push(this.makePickup(x - gap * 0.25));
      if (x < this.clearUntil) continue;
      const roll = this.rand();
      const kind: ObstacleKind = roll < 0.5 ? "tree" : roll < 0.75 ? "barn" : roll < 0.9 ? "bale" : "windmill";
      const wanted = kind === "tree" ? 110 + this.rand() * 70 : kind === "barn" ? 76 + this.rand() * 28 : kind === "bale" ? 34 : 150;
      const room = this.groundTop(x) - 150;
      const height = Math.min(wanted, room);
      if (height < 30) continue;
      const width = kind === "tree" ? 58 : kind === "barn" ? 100 : kind === "bale" ? 36 : 30;
      this.obstacles.push({ kind, x, w: width, h: height });
    }
    const behind = this.cameraX - 500;
    for (let index = this.obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = this.obstacles[index];
      if (obstacle && obstacle.x + obstacle.w < behind) this.obstacles.splice(index, 1);
    }
    for (let index = this.pickups.length - 1; index >= 0; index -= 1) {
      const coin = this.pickups[index];
      if (coin && (coin.taken || coin.x < behind)) this.pickups.splice(index, 1);
    }
  }

  private emitSmoke(dt: number, rate: number) {
    if (this.reducedMotion) return;
    if (Math.random() > dt * rate) return;
    this.smoke.push({
      x: this.planeScreenX() + 18,
      y: this.planeY + 6,
      vx: -30 - Math.random() * 24,
      vy: -12 - Math.random() * 16,
      life: 1,
      r: 7 + Math.random() * 7,
      color: "120, 108, 96",
    });
    if (this.smoke.length > 48) this.smoke.shift();
  }

  private burst(x: number, y: number, color: string) {
    if (this.reducedMotion) return;
    for (let index = 0; index < 6; index += 1) {
      this.smoke.push({
        x,
        y,
        vx: -20 + Math.random() * 80,
        vy: -40 + Math.random() * 40,
        life: 1,
        r: 3,
        color,
      });
    }
  }

  private driftSmoke(dt: number) {
    for (let index = this.smoke.length - 1; index >= 0; index -= 1) {
      const puff = this.smoke[index];
      if (!puff) continue;
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.life -= dt * 0.8;
      puff.r += dt * 8;
      if (puff.life <= 0) this.smoke.splice(index, 1);
    }
  }

  private paintHud() {
    if (this.wallet !== this.shownCoins) {
      this.shownCoins = this.wallet;
      this.refs.coins.textContent = String(this.wallet);
    }
    const label = formatDistance(this.distance);
    if (label !== this.shownDistance) {
      this.shownDistance = label;
      this.refs.distance.textContent = label;
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D) {
    const sky = ctx.createLinearGradient(0, 0, 0, this.h);
    sky.addColorStop(0, "#6eb6e0");
    sky.addColorStop(0.55, "#b7def2");
    sky.addColorStop(1, "#f3e2c4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.w, this.h);
    const sunX = this.w * 0.78;
    const sunY = this.h * 0.16;
    const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 90);
    glow.addColorStop(0, "rgba(255, 244, 196, 0.95)");
    glow.addColorStop(1, "rgba(255, 244, 196, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawClouds(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
    for (let index = 0; index < 8; index += 1) {
      const world = index * 460 + 80;
      const x = ((world - this.cameraX * 0.18) % (this.w + 280)) - 40;
      const y = 46 + ((index * 53) % 90);
      drawCloud(ctx, x < -80 ? x + this.w + 280 : x, y, 0.85 + (index % 3) * 0.18);
    }
  }

  private drawHills(ctx: CanvasRenderingContext2D) {
    const amp = Math.min(this.h * 0.07, 64);
    const farBase = Math.min(this.h * 0.045, 36);
    const nearBase = Math.min(this.h * 0.02, 16);
    this.fillRidge(ctx, 0.22, "#a7c0d0", farBase, (x) => hill(x, amp));
    this.fillRidge(ctx, 0.4, "#8d9c90", nearBase, (x) => hill(x * 1.3, amp * 0.72));
    const cam = this.cameraX * 0.22;
    for (let index = Math.floor(cam / 700) - 1; index < cam / 700 + this.w / 700 + 2; index += 1) {
      const world = index * 700;
      const x = world - cam;
      const y = this.h - farBase - hill(world, amp);
      ctx.fillStyle = "#8d97a1";
      ctx.fillRect(x, y - 8, 12, 8);
      ctx.fillStyle = "#b7a090";
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 8);
      ctx.lineTo(x + 6, y - 16);
      ctx.lineTo(x + 14, y - 8);
      ctx.fill();
    }
  }

  private fillRidge(
    ctx: CanvasRenderingContext2D,
    parallax: number,
    color: string,
    baseline: number,
    heightAt: (x: number) => number,
  ) {
    const cam = this.cameraX * parallax;
    ctx.beginPath();
    ctx.moveTo(0, this.h);
    for (let sx = 0; sx <= this.w + 24; sx += 24) {
      ctx.lineTo(sx, this.h - baseline - heightAt(cam + sx));
    }
    ctx.lineTo(this.w, this.h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawFields(ctx: CanvasRenderingContext2D) {
    const lip = Math.max(10, Math.min(18, this.h * 0.028));
    this.fillGround(ctx, 0, "#5c3b22");

    const band = 280;
    let sx = -((this.cameraX % band) + band) % band;
    while (sx < this.w) {
      const world = this.cameraX + sx;
      const index = Math.floor(world / band);
      const x2 = Math.min(this.w, sx + (band - (((world % band) + band) % band)));
      if (x2 <= sx) break;
      ctx.beginPath();
      ctx.moveTo(sx, this.h);
      for (let x = sx; x <= x2 + 8; x += 12) {
        ctx.lineTo(x, this.groundTop(this.cameraX + x) + lip);
      }
      ctx.lineTo(x2, this.h);
      ctx.closePath();
      ctx.fillStyle = FIELDS[((index % FIELDS.length) + FIELDS.length) % FIELDS.length] ?? FIELDS[0];
      ctx.fill();
      if (WHEAT.has(((index % FIELDS.length) + FIELDS.length) % FIELDS.length)) {
        ctx.strokeStyle = "rgba(255, 236, 180, 0.35)";
        ctx.lineWidth = 1;
        for (let x = sx; x < x2; x += 12) {
          const gy = this.groundTop(this.cameraX + x) + lip;
          ctx.beginPath();
          ctx.moveTo(x, gy + 4);
          ctx.lineTo(x + 1, gy + 14);
          ctx.stroke();
        }
      }
      sx = x2;
    }

    this.strokeGround(ctx, lip * 0.45, "#3a2416", lip);
    this.strokeGround(ctx, 0, "#f7f4ee", 3.5);
    this.strokeGround(ctx, -1.5, "#c8f542", 2);
  }

  private fillGround(ctx: CanvasRenderingContext2D, offset: number, color: string) {
    ctx.beginPath();
    ctx.moveTo(0, this.h);
    for (let x = 0; x <= this.w + 8; x += 8) {
      ctx.lineTo(x, this.groundTop(this.cameraX + x) + offset);
    }
    ctx.lineTo(this.w, this.h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private strokeGround(ctx: CanvasRenderingContext2D, offset: number, color: string, width: number) {
    ctx.beginPath();
    for (let x = 0; x <= this.w; x += 8) {
      const y = this.groundTop(this.cameraX + x) + offset;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawDecor(ctx: CanvasRenderingContext2D) {
    const start = Math.floor((this.cameraX - 40) / 90);
    const end = Math.floor((this.cameraX + this.w + 40) / 90);
    for (let index = start; index <= end; index += 1) {
      const worldX = index * 90 + 20;
      const sx = worldX - this.cameraX;
      const gy = this.groundTop(worldX);
      if (index % 4 === 0) {
        ctx.strokeStyle = "#6d5436";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, gy);
        ctx.lineTo(sx, gy - 16);
        ctx.moveTo(sx, gy - 8);
        ctx.lineTo(sx + 22, gy - 8);
        ctx.stroke();
      }
      if (index % 7 === 2) {
        ctx.fillStyle = "#f7f4ee";
        ctx.beginPath();
        ctx.ellipse(sx, gy - 8, 11, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c2824";
        ctx.beginPath();
        ctx.arc(sx + 9, gy - 11, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = index % 2 === 0 ? "#d4566a" : "#f2d25a";
      ctx.beginPath();
      ctx.arc(sx + 8, gy - 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const obstacle of this.obstacles) {
      const sx = obstacle.x - this.cameraX;
      if (sx > this.w + 80 || sx + obstacle.w < -80) continue;
      const ground = this.groundTop(obstacle.x + obstacle.w / 2);
      if (obstacle.kind === "tree") this.drawTree(ctx, sx, ground, obstacle.w, obstacle.h);
      else if (obstacle.kind === "barn") this.drawBarn(ctx, sx, ground, obstacle.w, obstacle.h);
      else if (obstacle.kind === "windmill") this.drawWindmill(ctx, sx, ground, obstacle.w, obstacle.h);
      else this.drawBale(ctx, sx, ground, obstacle.w, obstacle.h);
    }
  }

  private drawTree(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number, h: number) {
    const crown = ground - h + w * 0.45;
    ctx.fillStyle = "#6b4a32";
    ctx.fillRect(x + w / 2 - 5, crown, 10, ground - crown);
    ctx.fillStyle = "#3f7a3a";
    ctx.beginPath();
    ctx.arc(x + w / 2, crown, w * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#67a34e";
    ctx.beginPath();
    ctx.arc(x + w / 2 - 10, crown + 4, w * 0.28, 0, Math.PI * 2);
    ctx.arc(x + w / 2 + 12, crown + 2, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBarn(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number, h: number) {
    const top = ground - h;
    ctx.fillStyle = "#9a4036";
    ctx.fillRect(x, top + 16, w, h - 16);
    ctx.fillStyle = "#7c322b";
    ctx.beginPath();
    ctx.moveTo(x - 6, top + 18);
    ctx.lineTo(x + w / 2, top);
    ctx.lineTo(x + w + 6, top + 18);
    ctx.fill();
    ctx.fillStyle = "#f3efe4";
    ctx.fillRect(x + w / 2 - 8, ground - 28, 16, 28);
    ctx.fillStyle = "#d7efe8";
    ctx.fillRect(x + 12, top + 28, 12, 10);
  }

  private drawWindmill(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number, h: number) {
    const top = ground - h;
    ctx.fillStyle = "#e7e0d4";
    ctx.beginPath();
    ctx.moveTo(x + 4, ground);
    ctx.lineTo(x + w - 4, ground);
    ctx.lineTo(x + w - 10, top + 10);
    ctx.lineTo(x + 10, top + 10);
    ctx.fill();
    ctx.save();
    ctx.translate(x + w / 2, top + 8);
    ctx.rotate(this.time * 1.4);
    ctx.fillStyle = "#f7f1e6";
    for (let blade = 0; blade < 4; blade += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(0, -3, 46, 6);
    }
    ctx.restore();
    ctx.fillStyle = "#8d4e2e";
    ctx.beginPath();
    ctx.arc(x + w / 2, top + 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBale(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number, h: number) {
    ctx.fillStyle = "#e2c36a";
    ctx.fillRect(x, ground - h, w, h);
    ctx.strokeStyle = "#b48a3a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 6, ground - h + 4);
    ctx.lineTo(x + 6, ground - 4);
    ctx.moveTo(x + w - 6, ground - h + 4);
    ctx.lineTo(x + w - 6, ground - 4);
    ctx.stroke();
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const coin of this.pickups) {
      if (coin.taken) continue;
      const sx = coin.x - this.cameraX;
      if (sx < -20 || sx > this.w + 20) continue;
      const sy = this.groundTop(coin.x) - coin.lift + Math.sin(this.time * 3 + coin.x) * 4;
      ctx.fillStyle = "#f0c84a";
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a87a1c";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 248, 214, 0.8)";
      ctx.beginPath();
      ctx.arc(sx - 3, sy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSmoke(ctx: CanvasRenderingContext2D) {
    for (const puff of this.smoke) {
      const alpha = Math.max(0, puff.life) * 0.45;
      ctx.fillStyle = `rgba(${puff.color}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawShadow(ctx: CanvasRenderingContext2D) {
    const px = this.planeScreenX();
    const ground = this.groundTop(this.planeWorldX());
    const height = Math.max(0, ground - this.planeY);
    const scale = clamp(1 - height / 380, 0.25, 1);
    ctx.fillStyle = `rgba(48, 72, 36, ${0.28 * scale})`;
    ctx.beginPath();
    ctx.ellipse(px, ground - 2, 34 * scale, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawAircraft(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.planeScreenX(), this.planeY);
    const tilt = this.mode === "crashed" ? this.crashedTilt : this.pitch;
    ctx.rotate(tilt);
    ctx.scale(1.55, 1.55);
    drawPlane(ctx, this.prop, this.plane);
    ctx.restore();
  }

  private drawBirds(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "#314049";
    ctx.lineWidth = 1.6;
    for (let index = 0; index < 5; index += 1) {
      const world = index * 540 + 200;
      const x = ((world - this.cameraX * 0.55) % (this.w + 160)) - 20;
      const y = 80 + ((index * 37) % 70) + Math.sin(this.time + index) * 6;
      const flap = this.time * 6 + index;
      const drawX = x < -30 ? x + this.w + 160 : x;
      ctx.beginPath();
      ctx.moveTo(drawX - 8, y);
      ctx.quadraticCurveTo(drawX - 4, y - 5 - Math.sin(flap) * 3, drawX, y);
      ctx.quadraticCurveTo(drawX + 4, y - 5 - Math.sin(flap) * 3, drawX + 8, y);
      ctx.stroke();
    }
  }

  private bindPitch(button: HTMLButtonElement, direction: "up" | "down") {
    const press = (event: PointerEvent) => {
      if (this.mode !== "playing") return;
      event.preventDefault();
      this.pitchHold = direction;
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that has already ended can still pitch the plane.
      }
    };
    const release = () => {
      if (this.pitchHold !== direction) return;
      this.pitchHold = null;
      button.setAttribute("aria-pressed", "false");
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
  }

  private releasePitch() {
    this.refs.pitchUp.setAttribute("aria-pressed", "false");
    this.refs.pitchDown.setAttribute("aria-pressed", "false");
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (this.mode !== "playing") return;
    event.preventDefault();
    this.held = true;
  };

  private readonly onPointerUp = () => {
    this.held = false;
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !this.refs.shop.classList.contains("hidden")) {
      event.preventDefault();
      this.closeShop();
      return;
    }
    const tag = document.activeElement?.tagName;
    if ((tag === "BUTTON" || tag === "INPUT") && this.mode !== "playing") return;
    if (this.mode === "playing" && (event.key === " " || event.key.startsWith("Arrow"))) event.preventDefault();
    this.keys.add(event.key.toLowerCase());
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private readonly onBlur = () => {
    this.held = false;
    this.pitchHold = null;
    this.releasePitch();
    this.keys.clear();
  };
}
