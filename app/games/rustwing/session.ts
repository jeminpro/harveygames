import { rustwingMarkup } from "./markup";

const FIELDS = ["#7eac4a", "#d2ae55", "#6b9a42", "#c48a4a", "#8fba58", "#5f8c3e"];
const WHEAT = new Set([1, 3]);

type ShopId = "wing" | "wheel" | "prop" | "pouch";

const SHOP: Array<{ id: ShopId; name: string; detail: string; price: number }> = [
  { id: "wing", name: "Patched wing", detail: "The nose climbs faster.", price: 40 },
  { id: "wheel", name: "Spare wheel", detail: "You start higher, with a longer safe start.", price: 60 },
  { id: "prop", name: "Fresh propeller", detail: "Fly faster, so the countryside pays sooner.", price: 100 },
  { id: "pouch", name: "Deep pockets", detail: "Coins in the sky are worth double.", price: 140 },
];

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

function terrain(x: number, viewH: number) {
  const lift = Math.min(viewH * 0.42, 300);
  const base = Math.max(64, Math.min(140, viewH * 0.14));
  return base + wave(x) * lift;
}

function hill(x: number) {
  return 90 + Math.sin(x * 0.00042) * 54 + Math.sin(x * 0.00015 + 1.4) * 28;
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

function drawPlane(ctx: CanvasRenderingContext2D, prop: number) {
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

    const climb = this.held || this.pitchHold === "up" || this.keys.has("arrowup") || this.keys.has("w") || this.keys.has(" ");
    const dive = !climb && (this.pitchHold === "down" || this.keys.has("arrowdown") || this.keys.has("s"));
    let ay = 460;
    if (climb) ay -= this.owned.has("wing") ? 1500 : 1180;
    if (dive) ay += 640;
    this.vy = clamp(this.vy + ay * dt, -360, 460);
    this.planeY = clamp(this.planeY + this.vy * dt, 28, this.h - 20);
    const targetPitch = climb ? -0.78 : dive ? 0.82 : 0.06;
    this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * (this.reducedMotion ? 18 : 9));
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
        if (SHOP.some((item) => item.id === id)) this.owned.add(id as ShopId);
      }
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

  private rememberOwned() {
    const stored = localStorage.getItem("rustwing-owned") ?? "";
    for (const id of stored.split(",")) {
      if (SHOP.some((item) => item.id === id)) this.owned.add(id as ShopId);
    }
  }

  private saveProgress() {
    try {
      this.rememberOwned();
      const raw = localStorage.getItem("rustwing-wallet");
      const stored = raw === null ? this.wallet : Number(raw) || 0;
      const next = Math.max(0, stored + this.unsavedEarn - this.unsavedSpend);
      this.unsavedEarn = 0;
      this.unsavedSpend = 0;
      this.wallet = next;
      localStorage.setItem("rustwing-wallet", String(this.wallet));
      localStorage.setItem("rustwing-owned", [...this.owned].join(","));
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
    this.refs.shopClose.focus();
  }

  private closeShop() {
    this.refs.shop.classList.add("hidden");
  }

  private renderShop() {
    this.refs.shopList.replaceChildren();
    for (const item of SHOP) {
      const row = document.createElement("li");
      const copy = document.createElement("div");
      const name = document.createElement("b");
      name.textContent = item.name;
      const detail = document.createElement("small");
      detail.textContent = item.detail;
      copy.append(name, detail);
      const button = document.createElement("button");
      button.type = "button";
      const owned = this.owned.has(item.id);
      if (owned) {
        button.textContent = "Owned";
        button.disabled = true;
      } else {
        button.textContent = String(item.price);
        button.disabled = this.wallet < item.price;
        button.setAttribute("aria-label", `Buy ${item.name} for ${item.price} coins`);
        button.onclick = () => this.buy(item.id);
      }
      row.append(copy, button);
      this.refs.shopList.append(row);
    }
  }

  private buy(id: ShopId) {
    const item = SHOP.find((entry) => entry.id === id);
    if (!item || this.owned.has(id) || this.wallet < item.price) return;
    this.wallet -= item.price;
    this.unsavedSpend += item.price;
    this.owned.add(id);
    this.saveProgress();
    this.shownCoins = -1;
    this.paintHud();
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
    sky.addColorStop(0.42, "#b9def3");
    sky.addColorStop(0.72, "#f6e7c4");
    sky.addColorStop(1, "#d5e2a4");
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
    this.fillRidge(ctx, 0.28, "#8eaa78", 150, (x) => hill(x));
    this.fillRidge(ctx, 0.45, "#7c9968", 70, (x) => hill(x * 1.3) * 0.75);
    const cam = this.cameraX * 0.28;
    for (let index = Math.floor(cam / 700) - 1; index < cam / 700 + this.w / 700 + 2; index += 1) {
      const x = index * 700 - cam;
      const y = this.h - 150 - hill(index * 700);
      ctx.fillStyle = "#6d5a4a";
      ctx.fillRect(x, y - 8, 12, 8);
      ctx.fillStyle = "#8d4d3a";
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
        ctx.lineTo(x, this.groundTop(this.cameraX + x));
      }
      ctx.lineTo(x2, this.h);
      ctx.closePath();
      ctx.fillStyle = FIELDS[((index % FIELDS.length) + FIELDS.length) % FIELDS.length] ?? FIELDS[0];
      ctx.fill();
      if (WHEAT.has(((index % FIELDS.length) + FIELDS.length) % FIELDS.length)) {
        ctx.strokeStyle = "rgba(255, 236, 180, 0.35)";
        ctx.lineWidth = 1;
        for (let x = sx; x < x2; x += 12) {
          const gy = this.groundTop(this.cameraX + x);
          ctx.beginPath();
          ctx.moveTo(x, gy + 8);
          ctx.lineTo(x + 1, gy + 18);
          ctx.stroke();
        }
      }
      sx = x2;
    }

    ctx.beginPath();
    for (let x = 0; x <= this.w; x += 10) {
      const gy = this.groundTop(this.cameraX + x);
      if (x === 0) ctx.moveTo(x, gy + 16);
      else ctx.lineTo(x, gy + 16);
    }
    ctx.strokeStyle = "rgba(176, 132, 72, 0.85)";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.strokeStyle = "#3e6b32";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= this.w; x += 8) {
      const gy = this.groundTop(this.cameraX + x);
      if (x === 0) ctx.moveTo(x, gy);
      else ctx.lineTo(x, gy);
    }
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
    drawPlane(ctx, this.prop);
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
