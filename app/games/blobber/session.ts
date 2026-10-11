import { blobberMarkup } from "./markup";

const COLORS = ["#c9f695", "#8dc9ff", "#bfa6ff", "#ffadbb", "#ffcd83"];
const COLOR_NAMES = ["lime", "blue", "purple", "pink", "orange"];
const NAMES = [
  "miso", "big mood", "orbit", "noodle", "peach", "chomp", "jelly", "tiny menace", "snack king", "moon",
  "bloop", "avocado", "cosmo", "squish", "pixel", "mango", "cloud", "pickle", "nova", "drift",
  "echo", "sprout", "comet", "pudding", "zippy", "nebula", "bubble", "kiwi", "tater", "luna",
  "zigzag", "poppy", "spark", "waffle", "bean", "meteor",
];
const LEVELS: Level[] = [
  { id: "free", name: "Free arena", goal: 0, instructions: "Grow, split and explore at your own pace.", next: null },
  { id: "triangles", name: "Triangle trail", goal: 4, instructions: "Collect 4 golden triangles.", next: "slalom" },
  { id: "slalom", name: "Square slalom", goal: 30, instructions: "Collect 30 food dots. A red square resets your count.", next: "diamonds" },
  { id: "diamonds", name: "Diamond keys", goal: 3, instructions: "Collect 3 blue diamonds, then enter the purple portal.", next: "free" },
];
const WORLD = 7200;
const FOOD_COUNT = 6441;
const TRIANGLE_COUNT = 73;
const TRIANGLE_RESPAWN = 16;
const SQUARE_COUNT = 73;
const SQUARE_RESPAWN = 16;
const MUSIC_MELODY = [
  72, null, 76, 79, 84, 79, 76, 74, 72, 76, 81, 76, 79, 76, 72, null,
  77, 76, 74, 72, 69, 72, 77, null, 74, 79, 83, 79, 77, 74, 71, null,
  72, 76, 79, 84, 83, 79, 76, null, 81, 79, 76, 72, 76, 79, 81, null,
  77, 79, 81, 77, 76, 74, 72, null, 71, 74, 79, 77, 76, 74, 72, null,
];
const MUSIC_BASS = [48, 45, 41, 43, 48, 45, 41, 43];
const MUSIC_BEAT = 60 / 110 / 2;
const NEBULAE: Array<[number, number, number, string]> = [
  [0.77, 0.27, 0.58, "#7957d657"],
  [0.39, 0.85, 0.6, "#168dcf48"],
  [0.95, 0.86, 0.44, "#c34a9c42"],
  [0.12, 0.05, 0.4, "#31559548"],
  [0.59, 0.49, 0.32, "#35b5a838"],
  [0.19, 0.57, 0.33, "#b9783128"],
];

type Level = {
  id: string;
  name: string;
  goal: number;
  instructions: string;
  next: string | null;
};

type Point = { x: number; y: number };

type Cell = {
  owner: number;
  x: number;
  y: number;
  mass: number;
  color: string;
  name: string;
  vx: number;
  vy: number;
  target: Point | null;
  think: number;
  wander: number;
};

type Pellet = { x: number; y: number; mass: number; r: number; color: string };
type Shape = { x: number; y: number; r: number; cooldown: number };
type Diamond = { x: number; y: number; r: number; collected: boolean };
type Portal = { x: number; y: number; r: number };
type Particle = { x: number; y: number; r: number; color: string; life: number };
type Mode = "menu" | "playing" | "paused" | "dead" | "complete";

type BlobberOptions = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  onExit: () => void;
  getView: () => { width: number; height: number; resolution: number };
};

type Refs = {
  minimap: HTMLCanvasElement;
  sound: HTMLButtonElement;
  soundMark: HTMLElement;
  music: HTMLButtonElement;
  pause: HTMLButtonElement;
  cabinetHome: HTMLButtonElement;
  brand: HTMLButtonElement;
  menu: HTMLElement;
  name: HTMLInputElement;
  swatches: HTMLDivElement;
  difficulty: HTMLSelectElement;
  level: HTMLSelectElement;
  levelDescription: HTMLElement;
  startForm: HTMLFormElement;
  menuBest: HTMLElement;
  worldNote: HTMLElement;
  footer: HTMLElement;
  hud: HTMLElement;
  mass: HTMLElement;
  best: HTMLElement;
  time: HTMLElement;
  challengePanel: HTMLElement;
  levelTitle: HTMLElement;
  levelCount: HTMLElement;
  levelGoal: HTMLElement;
  levelBar: HTMLProgressElement;
  leaderboardToggle: HTMLButtonElement;
  leaderboard: HTMLElement;
  rank: HTMLElement;
  boardToggleRank: HTMLElement;
  leaders: HTMLOListElement;
  hint: HTMLElement;
  join: HTMLButtonElement;
  split: HTMLButtonElement;
  eject: HTMLButtonElement;
  helpOpen: HTMLButtonElement;
  help: HTMLElement;
  helpClose: HTMLButtonElement;
  dialog: HTMLElement;
  dialogTag: HTMLElement;
  dialogTitle: HTMLElement;
  dialogCopy: HTMLElement;
  roundStats: HTMLElement;
  resume: HTMLButtonElement;
  nextLevel: HTMLButtonElement;
  restart: HTMLButtonElement;
  home: HTMLButtonElement;
  toast: HTMLElement;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function radius(mass: number) {
  return Math.sqrt(mass) * 5;
}

function pellet(x = rand(20, WORLD - 20), y = rand(20, WORLD - 20), mass = 1): Pellet {
  return {
    x,
    y,
    mass,
    r: mass > 1 ? 6 : rand(2.5, 4.5),
    color: COLORS[Math.floor(rand(0, COLORS.length))] ?? COLORS[0],
  };
}

function triangle(x = rand(40, WORLD - 40), y = rand(40, WORLD - 40)): Shape {
  return { x, y, r: 14, cooldown: 0 };
}

function square(x = rand(40, WORLD - 40), y = rand(40, WORLD - 40)): Shape {
  return { x, y, r: 12, cooldown: 0 };
}

function cell(owner: number, x: number, y: number, mass: number, color: string, name: string): Cell {
  return { owner, x, y, mass, color, name, vx: 0, vy: 0, target: null, think: 0, wander: rand(0, 6.28) };
}

function diamond(x: number, y: number): Diamond {
  return { x, y, r: 15, collected: false };
}

function findLevel(id: string) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}

function must<T extends Element>(root: ParentNode, id: string) {
  const node = root.querySelector<T>(`#${id}`);
  if (!node) throw new Error(`Blobber is missing #${id}.`);
  return node;
}

function audioContext(): AudioContext | null {
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;
  try {
    return new Context();
  } catch {
    return null;
  }
}

export class BlobberSession {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly mini: CanvasRenderingContext2D;
  private readonly refs: Refs;
  private readonly spaceCanvas = document.createElement("canvas");
  private readonly spaceCtx: CanvasRenderingContext2D;
  private readonly reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  private readonly stars = Array.from({ length: 180 }, (_, index) => ({
    x: ((index * 137.508) % 997) / 997,
    y: ((index * 271.83) % 991) / 991,
    r: index % 13 === 0 ? 1.5 : 0.5 + (index % 3) * 0.25,
    depth: 0.025 + (index % 4) * 0.018,
    phase: index * 1.7,
  }));

  private mode: Mode = "menu";
  private cells: Cell[] = [];
  private food: Pellet[] = [];
  private triangles: Shape[] = [];
  private squares: Shape[] = [];
  private particles: Particle[] = [];
  private diamonds: Diamond[] = [];
  private portal: Portal | null = null;
  private selected = COLORS[0];
  private camera = { x: WORLD / 2, y: WORLD / 2, zoom: 0.65 };
  private pointer = { x: 0, y: 0, active: false };
  private keys: Record<string, boolean> = {};
  private elapsed = 0;
  private eaten = 0;
  private peak = 0;
  private frame = 0;
  private difficulty = "normal";
  private sound = false;
  private audioCtx: AudioContext | null = null;
  private best = 0;
  private toastTimer = 0;
  private activeLevel: Level = LEVELS[0];
  private levelProgress = 0;
  private levelMistakes = 0;
  private leaderboardOpen = false;
  private helpHeldPlay = false;
  private musicEnabled = false;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicGain: GainNode | null = null;
  private musicStep = 0;
  private nextMusicNote = 0;
  private musicRun = 0;
  private readonly musicVoices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  private w = 0;
  private h = 0;
  private dpr = 1;
  private paintedW = -1;
  private paintedH = -1;
  private disposed = false;

  constructor(private readonly options: BlobberOptions) {
    this.root = options.root;
    this.canvas = options.canvas;
    this.ctx = options.context;
    this.root.innerHTML = blobberMarkup;
    this.refs = this.collect();
    const mini = this.refs.minimap.getContext("2d");
    const space = this.spaceCanvas.getContext("2d");
    if (!mini || !space) throw new Error("Blobber could not open a drawing surface.");
    this.mini = mini;
    this.spaceCtx = space;
    this.bind();
    this.boot();
  }

  step(deltaMs: number) {
    if (this.disposed) return;
    this.readView();
    this.advance(Math.min(Math.max(deltaMs, 0) / 1000, 0.04));
  }

  render() {
    if (this.disposed) return;
    this.syncBuffer();
    if (this.w < 2 || this.h < 2) return;
    this.draw();
    if (++this.frame % 15 === 0) this.updateHud();
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.musicRun += 1;
    this.musicEnabled = false;
    this.stopMusic();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    window.clearTimeout(this.toastTimer);
    void this.audioCtx?.close().catch(() => undefined);
  }

  private collect(): Refs {
    return {
      minimap: must(this.root, "minimap"),
      sound: must(this.root, "sound"),
      soundMark: must(this.root, "soundMark"),
      music: must(this.root, "music"),
      pause: must(this.root, "pause"),
      cabinetHome: must(this.root, "cabinetHome"),
      brand: must(this.root, "brand"),
      menu: must(this.root, "menu"),
      name: must(this.root, "name"),
      swatches: must(this.root, "swatches"),
      difficulty: must(this.root, "difficulty"),
      level: must(this.root, "level"),
      levelDescription: must(this.root, "levelDescription"),
      startForm: must(this.root, "startForm"),
      menuBest: must(this.root, "menuBest"),
      worldNote: must(this.root, "worldNote"),
      footer: must(this.root, "footer"),
      hud: must(this.root, "hud"),
      mass: must(this.root, "mass"),
      best: must(this.root, "best"),
      time: must(this.root, "time"),
      challengePanel: must(this.root, "challengePanel"),
      levelTitle: must(this.root, "levelTitle"),
      levelCount: must(this.root, "levelCount"),
      levelGoal: must(this.root, "levelGoal"),
      levelBar: must(this.root, "levelBar"),
      leaderboardToggle: must(this.root, "leaderboardToggle"),
      leaderboard: must(this.root, "leaderboard"),
      rank: must(this.root, "rank"),
      boardToggleRank: must(this.root, "boardToggleRank"),
      leaders: must(this.root, "leaders"),
      hint: must(this.root, "hint"),
      join: must(this.root, "join"),
      split: must(this.root, "split"),
      eject: must(this.root, "eject"),
      helpOpen: must(this.root, "helpOpen"),
      help: must(this.root, "help"),
      helpClose: must(this.root, "helpClose"),
      dialog: must(this.root, "dialog"),
      dialogTag: must(this.root, "dialogTag"),
      dialogTitle: must(this.root, "dialogTitle"),
      dialogCopy: must(this.root, "dialogCopy"),
      roundStats: must(this.root, "roundStats"),
      resume: must(this.root, "resume"),
      nextLevel: must(this.root, "nextLevel"),
      restart: must(this.root, "restart"),
      home: must(this.root, "home"),
      toast: must(this.root, "toast"),
    };
  }

  private bind() {
    this.refs.level.onchange = () => this.updateLevelDescription();
    this.refs.nextLevel.onclick = () => {
      this.refs.level.value = this.activeLevel.next || "free";
      this.updateLevelDescription();
      this.start();
    };
    this.refs.startForm.onsubmit = (event) => {
      event.preventDefault();
      this.start();
    };
    this.refs.restart.onclick = () => this.start();
    this.refs.home.onclick = () => this.home();
    this.refs.brand.onclick = (event) => {
      event.preventDefault();
      if (this.mode !== "menu") this.home();
    };
    this.refs.cabinetHome.onclick = () => this.options.onExit();
    this.refs.pause.onclick = () => this.pause();
    this.refs.resume.onclick = () => this.pause();
    this.refs.split.onclick = () => this.split();
    this.refs.join.onclick = () => this.join();
    this.refs.eject.onclick = () => this.eject();
    this.refs.helpOpen.onclick = () => this.setHelpOpen(this.refs.help.classList.contains("hidden"));
    this.refs.helpClose.onclick = () => this.setHelpOpen(false);
    this.refs.help.onclick = (event) => {
      if (event.target === this.refs.help) this.setHelpOpen(false);
    };
    this.refs.sound.onclick = () => this.toggleSound();
    this.refs.music.onclick = () => {
      void this.toggleMusic();
    };
    this.refs.leaderboardToggle.onclick = () => {
      this.setLeaderboardOpen(!this.leaderboardOpen);
      this.releaseFocus();
    };
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
  }

  private boot() {
    try {
      this.best = Number(localStorage.getItem("blobber-best")) || 0;
      this.refs.name.value = localStorage.getItem("blobber-name") || "";
    } catch {
      this.best = 0;
    }
    this.refs.menuBest.textContent = String(this.best);
    this.refs.best.textContent = String(this.best);
    COLORS.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `swatch${index === 0 ? " selected" : ""}`;
      button.style.background = color;
      button.setAttribute("aria-label", `Choose ${COLOR_NAMES[index] ?? "color"}`);
      button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      button.onclick = () => {
        this.selected = color;
        this.root.querySelectorAll(".swatch").forEach((swatch) => {
          swatch.classList.remove("selected");
          swatch.setAttribute("aria-pressed", "false");
        });
        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");
      };
      this.refs.swatches.appendChild(button);
    });
    this.updateLevelDescription();
    this.updateMusicButton();
    this.initialize();
    void document.fonts?.ready.then(() => {
      if (!this.disposed) this.render();
    });
  }

  private readView() {
    const view = this.options.getView();
    this.w = view.width;
    this.h = view.height;
    this.dpr = view.resolution || 1;
  }

  private syncBuffer() {
    this.readView();
    if (this.w < 2 || this.h < 2) return;
    const bufferW = Math.max(1, Math.round(this.w * this.dpr));
    const bufferH = Math.max(1, Math.round(this.h * this.dpr));
    if (this.canvas.width !== bufferW || this.canvas.height !== bufferH) {
      this.canvas.width = bufferW;
      this.canvas.height = bufferH;
    }
    if (this.paintedW !== this.w || this.paintedH !== this.h) {
      this.paintNebula();
      this.paintedW = this.w;
      this.paintedH = this.h;
    }
  }

  private paintNebula() {
    const ctx = this.spaceCtx;
    this.spaceCanvas.width = Math.max(1, Math.round(this.w));
    this.spaceCanvas.height = Math.max(1, Math.round(this.h));
    ctx.fillStyle = "#0b1230";
    ctx.fillRect(0, 0, this.w, this.h);
    for (const [x, y, size, color] of NEBULAE) {
      const reach = Math.max(this.w, this.h) * size;
      const gradient = ctx.createRadialGradient(this.w * x, this.h * y, 0, this.w * x, this.h * y, reach);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.45, `${color.slice(0, 7)}20`);
      gradient.addColorStop(1, `${color.slice(0, 7)}00`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  private initialize() {
    const upper = this.difficulty === "hard" ? 220 : 125;
    this.food = Array.from({ length: FOOD_COUNT }, () => pellet());
    this.cells = NAMES.map((name, index) =>
      cell(index + 1, rand(100, WORLD - 100), rand(100, WORLD - 100), rand(18, upper), COLORS[index % 5] ?? COLORS[0], name),
    );
    this.triangles = Array.from({ length: TRIANGLE_COUNT }, () => triangle());
    this.squares = Array.from({ length: SQUARE_COUNT }, () => square());
    this.particles = [];
    this.levelProgress = 0;
    this.levelMistakes = 0;
    this.diamonds = [];
    this.portal = null;
    this.setupLevel();
  }

  private setupLevel() {
    const cx = WORLD / 2;
    const cy = WORLD / 2;
    if (this.activeLevel.id === "triangles") {
      for (let index = 0; index < 4; index += 1) {
        const angle = -Math.PI / 2 + index * (Math.PI / 2);
        this.triangles[index] = triangle(cx + Math.cos(angle) * 210, cy + Math.sin(angle) * 210);
      }
    }
    if (this.activeLevel.id === "slalom") {
      for (let index = 0; index < 16; index += 1) {
        const angle = index * (Math.PI / 8);
        const distance = index % 2 ? 390 : 260;
        this.squares[index] = square(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance);
      }
      for (let index = 0; index < 40; index += 1) {
        const angle = index * (Math.PI / 20);
        this.food[index] = pellet(cx + Math.cos(angle) * 330, cy + Math.sin(angle) * 330);
      }
    }
    if (this.activeLevel.id === "diamonds") {
      this.diamonds = [diamond(cx - 170, cy - 140), diamond(cx + 190, cy - 90), diamond(cx + 30, cy + 210)];
      this.portal = { x: cx + 450, y: cy + 180, r: 30 };
    }
  }

  private updateLevelDescription() {
    const level = findLevel(this.refs.level.value);
    this.refs.levelDescription.textContent = level.instructions;
  }

  private updateLevelHud() {
    if (this.activeLevel.id === "free") {
      this.refs.challengePanel.classList.add("hidden");
      return;
    }
    this.refs.challengePanel.classList.remove("hidden");
    this.refs.levelTitle.textContent = this.activeLevel.name;
    const ready = this.activeLevel.id === "diamonds" && this.levelProgress >= this.activeLevel.goal;
    this.refs.levelCount.textContent = ready ? "Portal ready" : `${Math.min(this.levelProgress, this.activeLevel.goal)} / ${this.activeLevel.goal}`;
    this.refs.levelGoal.textContent = ready ? "Portal unlocked! Enter the purple ring." : this.activeLevel.instructions;
    this.refs.levelBar.max = this.activeLevel.goal;
    this.refs.levelBar.value = Math.min(this.levelProgress, this.activeLevel.goal);
  }

  private resetRoundButtons() {
    this.refs.nextLevel.classList.add("hidden");
    this.refs.restart.classList.remove("level-replay");
    this.refs.restart.innerHTML = "One more round <span>↗</span>";
  }

  private start() {
    if (this.disposed) return;
    this.hideHelp();
    this.releaseFocus();
    window.clearTimeout(this.toastTimer);
    this.refs.toast.classList.remove("show");
    this.difficulty = this.refs.difficulty.value;
    this.activeLevel = findLevel(this.refs.level.value);
    this.initialize();
    this.updateLevelDescription();
    this.resetRoundButtons();
    this.elapsed = 0;
    this.eaten = 0;
    this.peak = 20;
    this.keys = {};
    this.pointer.active = false;
    const player = cell(0, WORLD / 2, WORLD / 2, 20, this.selected, this.refs.name.value.trim() || "little blob");
    for (const blob of this.cells) {
      if (Math.hypot(blob.x - player.x, blob.y - player.y) <= 420) {
        blob.x = rand(100, 500);
        blob.y = rand(100, WORLD - 100);
      }
    }
    this.cells.push(player);
    this.camera = { x: player.x, y: player.y, zoom: 1.1 };
    this.mode = "playing";
    this.setLeaderboardOpen(false);
    this.refs.menu.classList.add("hidden");
    this.refs.worldNote.classList.add("hidden");
    this.refs.footer.classList.add("hidden");
    this.refs.dialog.classList.add("hidden");
    this.refs.hud.classList.remove("hidden");
    this.refs.pause.classList.remove("hidden");
    try {
      localStorage.setItem("blobber-name", player.name);
    } catch {
      // The name still applies to this round when storage is blocked.
    }
    this.updateHud();
    this.render();
    this.notify(
      this.activeLevel.id === "free"
        ? "You\u2019re marked YOU. Safe start for 3 seconds!"
        : `${this.activeLevel.name}: ${this.activeLevel.instructions}`,
    );
    this.beep(550);
  }

  private home() {
    if (this.disposed) return;
    this.mode = "menu";
    this.hideHelp();
    this.setLeaderboardOpen(false);
    this.refs.menu.classList.remove("hidden");
    this.refs.worldNote.classList.remove("hidden");
    this.refs.footer.classList.remove("hidden");
    this.refs.dialog.classList.add("hidden");
    this.refs.hud.classList.add("hidden");
    this.refs.pause.classList.add("hidden");
    this.refs.menuBest.textContent = String(this.best);
    this.initialize();
    this.camera = { x: WORLD / 2, y: WORLD / 2, zoom: 0.65 };
    this.keys = {};
    this.pointer.active = false;
  }

  private pause() {
    if (this.disposed) return;
    if (this.mode === "playing") {
      this.refs.nextLevel.classList.add("hidden");
      this.setLeaderboardOpen(false);
      this.mode = "paused";
      this.refs.dialogTitle.textContent = "Snack break.";
      this.refs.dialogTag.textContent = "TAKE A BREATHER";
      this.refs.dialogCopy.textContent = "The arena can wait a moment.";
      this.refs.roundStats.classList.add("hidden");
      this.refs.resume.classList.remove("hidden");
      this.refs.restart.classList.add("hidden");
      this.refs.dialog.classList.remove("hidden");
      this.keys = {};
      this.refs.resume.focus();
      return;
    }
    if (this.mode === "paused") {
      this.releaseFocus();
      this.keys = {};
      this.mode = "playing";
      this.refs.dialog.classList.add("hidden");
      this.pointer.active = false;
    }
  }

  private completeLevel() {
    if (this.mode !== "playing" || this.activeLevel.id === "free") return;
    this.updateHud();
    this.mode = "complete";
    this.keys = {};
    this.pointer.active = false;
    this.setLeaderboardOpen(false);
    const next = LEVELS.find((level) => level.id === this.activeLevel.next);
    this.refs.dialogTitle.textContent = `${this.activeLevel.name} complete!`;
    this.refs.dialogTag.textContent = "LEVEL COMPLETE";
    this.refs.dialogCopy.textContent = next?.id === "free"
      ? "All three shape challenges cleared. Keep exploring in the free arena."
      : `Next: ${next?.name ?? "Free arena"}. ${next?.instructions ?? ""}`;
    this.refs.roundStats.innerHTML = `<div><small>COLLECTED</small><b>${Math.min(this.levelProgress, this.activeLevel.goal)}</b></div><div><small>TIME</small><b>${this.formatTime(this.elapsed)}</b></div><div><small>PEAK MASS</small><b>${Math.floor(this.peak)}</b></div>`;
    this.refs.roundStats.classList.remove("hidden");
    this.refs.resume.classList.add("hidden");
    this.refs.nextLevel.innerHTML = `${next?.id === "free" ? "Free arena" : "Next level"} <span>→</span>`;
    this.refs.nextLevel.classList.remove("hidden");
    this.refs.restart.innerHTML = "Replay this level <span>↻</span>";
    this.refs.restart.classList.add("level-replay");
    this.refs.restart.classList.remove("hidden");
    this.refs.dialog.classList.remove("hidden");
    this.refs.nextLevel.focus();
    this.beep(700);
  }

  private checkLevelComplete() {
    if (this.mode !== "playing" || this.activeLevel.id === "free" || this.levelProgress < this.activeLevel.goal) return;
    const gate = this.portal;
    if (
      this.activeLevel.id === "diamonds" &&
      (!gate || !this.cells.some((blob) => blob.owner === 0 && Math.hypot(blob.x - gate.x, blob.y - gate.y) < radius(blob.mass) + gate.r * 0.5))
    ) {
      return;
    }
    this.completeLevel();
  }

  private dead() {
    this.setLeaderboardOpen(false);
    this.mode = "dead";
    this.resetRoundButtons();
    this.best = Math.max(this.best, Math.floor(this.peak));
    try {
      localStorage.setItem("blobber-best", String(this.best));
    } catch {
      // The round summary still shows the score for this session.
    }
    this.refs.dialogTitle.textContent = "A tasty little run.";
    this.refs.dialogTag.textContent = "SMALL BLOB. NEXT BIG THING.";
    this.refs.dialogCopy.textContent = "You got gobbled. Every big blob started small.";
    this.refs.roundStats.innerHTML = `<div><small>PEAK MASS</small><b>${Math.floor(this.peak)}</b></div><div><small>SURVIVED</small><b>${this.formatTime(this.elapsed)}</b></div><div><small>RIVALS EATEN</small><b>${this.eaten}</b></div>`;
    this.refs.roundStats.classList.remove("hidden");
    this.refs.resume.classList.add("hidden");
    this.refs.restart.classList.remove("hidden");
    this.refs.dialog.classList.remove("hidden");
    this.refs.restart.focus();
    this.beep(150);
  }

  private aim(blob: { x: number; y: number }) {
    let dx = 0;
    let dy = 0;
    if (this.keys.ArrowLeft || this.keys.a) dx -= 1;
    if (this.keys.ArrowRight || this.keys.d) dx += 1;
    if (this.keys.ArrowUp) dy -= 1;
    if (this.keys.ArrowDown || this.keys.s) dy += 1;
    if (dx || dy) return { dx, dy, keyboard: true };
    if (this.pointer.active) {
      return {
        dx: (this.pointer.x - this.w / 2) / this.camera.zoom + this.camera.x - blob.x,
        dy: (this.pointer.y - this.h / 2) / this.camera.zoom + this.camera.y - blob.y,
        keyboard: false,
      };
    }
    return { dx: 0, dy: 0, keyboard: false };
  }

  private split() {
    if (this.mode !== "playing") return;
    const mine = this.cells.filter((blob) => blob.owner === 0);
    if (mine.length >= 8) {
      this.notify("Eight blobs is plenty!");
      return;
    }
    let did = false;
    for (const blob of mine) {
      if (blob.mass < 36 || this.cells.filter((piece) => piece.owner === 0).length >= 8) continue;
      const direction = this.aim(blob);
      const angle = Math.atan2(direction.dy, direction.dx);
      blob.mass /= 2;
      const reach = radius(blob.mass);
      const piece = cell(0, blob.x + Math.cos(angle) * reach, blob.y + Math.sin(angle) * reach, blob.mass, blob.color, blob.name);
      piece.vx = Math.cos(angle) * 750;
      piece.vy = Math.sin(angle) * 750;
      this.cells.push(piece);
      did = true;
    }
    if (did) {
      this.updateHud();
      this.beep(650);
      this.notify("Split! J or Join brings blobs together one step at a time.");
    } else {
      this.notify("Reach 36 mass to split.");
    }
  }

  private eject() {
    if (this.mode !== "playing") return;
    for (const blob of this.cells.filter((piece) => piece.owner === 0)) {
      if (blob.mass < 20) continue;
      const direction = this.aim(blob);
      const angle = Math.atan2(direction.dy, direction.dx);
      blob.mass -= 3;
      const reach = radius(blob.mass);
      this.food.push(
        pellet(
          clamp(blob.x + Math.cos(angle) * (reach + 24), 5, WORLD - 5),
          clamp(blob.y + Math.sin(angle) * (reach + 24), 5, WORLD - 5),
          3,
        ),
      );
    }
    this.beep(250);
  }

  private join() {
    if (this.mode !== "playing") return;
    const mine = this.cells.filter((blob) => blob.owner === 0);
    if (mine.length < 2) {
      this.notify("You\u2019re already one blob.");
      return;
    }
    this.releaseFocus();
    const joined: Cell[] = [];
    while (mine.length > 1) {
      const first = mine.shift();
      if (!first) break;
      let nearest = 0;
      for (let index = 1; index < mine.length; index += 1) {
        const candidate = mine[index];
        const current = mine[nearest];
        if (!candidate || !current) continue;
        if (Math.hypot(candidate.x - first.x, candidate.y - first.y) < Math.hypot(current.x - first.x, current.y - first.y)) {
          nearest = index;
        }
      }
      const second = mine.splice(nearest, 1)[0];
      if (!second) {
        joined.push(first);
        break;
      }
      const mass = first.mass + second.mass;
      const reach = radius(mass);
      const x = (first.x * first.mass + second.x * second.mass) / mass;
      const y = (first.y * first.mass + second.y * second.mass) / mass;
      joined.push(cell(0, clamp(x, reach, WORLD - reach), clamp(y, reach, WORLD - reach), mass, first.color, first.name));
    }
    if (mine.length > 0 && mine[0]) joined.push(mine[0]);
    this.cells = this.cells.filter((blob) => blob.owner !== 0);
    this.cells.push(...joined);
    this.updateHud();
    this.render();
    this.notify(joined.length === 1 ? "Back together!" : `Joined one step. ${joined.length} blobs left.`);
    this.beep(550);
  }

  private rivalTarget(blob: Cell): Point {
    let threat: Cell | null = null;
    let prey: Cell | null = null;
    let threatDistance = Infinity;
    let preyDistance = Infinity;
    for (const other of this.cells) {
      if (other.owner === blob.owner) continue;
      const distance = Math.hypot(other.x - blob.x, other.y - blob.y);
      if (other.mass > blob.mass && distance < radius(other.mass) + 320 && distance < threatDistance) {
        threatDistance = distance;
        threat = other;
      }
      if (blob.mass > other.mass && distance < 600 && distance < preyDistance) {
        preyDistance = distance;
        prey = other;
      }
    }
    if (threat) return { x: blob.x + (blob.x - threat.x) * 5, y: blob.y + (blob.y - threat.y) * 5 };
    let bonus: Shape | null = null;
    let bonusDistance = 600;
    if (this.mode === "playing") {
      for (const shape of this.triangles) {
        if (shape.cooldown > 0) continue;
        const distance = Math.hypot(shape.x - blob.x, shape.y - blob.y);
        if (distance < bonusDistance) {
          bonusDistance = distance;
          bonus = shape;
        }
      }
    }
    if (bonus && (!prey || this.difficulty === "easy" || bonusDistance <= preyDistance)) return { x: bonus.x, y: bonus.y };
    if (prey && this.difficulty !== "easy") return { x: prey.x, y: prey.y };
    let closest: Pellet | null = null;
    let dist = Infinity;
    for (let index = 0; index < this.food.length; index += 3) {
      const dot = this.food[index];
      if (!dot) continue;
      const distance = (dot.x - blob.x) ** 2 + (dot.y - blob.y) ** 2;
      if (distance < dist) {
        closest = dot;
        dist = distance;
      }
    }
    return closest ?? { x: rand(100, WORLD - 100), y: rand(100, WORLD - 100) };
  }

  private advance(dt: number) {
    if (this.mode === "paused" || this.mode === "dead" || this.mode === "complete") return;
    if (this.mode === "playing") this.elapsed += dt;
    let massChanged = false;
    if (this.mode === "playing") {
      for (const shape of this.triangles) {
        if (shape.cooldown <= 0) continue;
        shape.cooldown = Math.max(0, shape.cooldown - dt);
        if (shape.cooldown === 0) Object.assign(shape, triangle());
      }
      for (const shape of this.squares) {
        if (shape.cooldown <= 0) continue;
        shape.cooldown = Math.max(0, shape.cooldown - dt);
        if (shape.cooldown === 0) Object.assign(shape, square());
      }
    }
    for (const blob of this.cells) {
      let dx = 0;
      let dy = 0;
      let keyboard = false;
      if (blob.owner === 0) {
        const direction = this.aim(blob);
        dx = direction.dx;
        dy = direction.dy;
        keyboard = direction.keyboard;
      } else {
        blob.think -= dt;
        if (blob.think <= 0 || !blob.target) {
          blob.think = rand(0.2, 0.5);
          blob.target = this.rivalTarget(blob);
        }
        dx = blob.target.x - blob.x;
        dy = blob.target.y - blob.y;
      }
      const len = Math.hypot(dx, dy);
      const arenaScale = blob.owner !== 0 && this.difficulty === "easy" ? 0.85 : blob.owner !== 0 && this.difficulty === "hard" ? 1.1 : 1;
      const speed = (185 / (1 + (blob.mass / 110) ** 0.4)) * arenaScale;
      const slow = blob.owner === 0 && !keyboard ? Math.min(1, len / 55) : 1;
      if (len > 0.01) {
        blob.x += (dx / len) * speed * slow * dt;
        blob.y += (dy / len) * speed * slow * dt;
      }
      blob.x += blob.vx * dt;
      blob.y += blob.vy * dt;
      blob.vx *= Math.exp(-5 * dt);
      blob.vy *= Math.exp(-5 * dt);
      const reach = radius(blob.mass);
      blob.x = clamp(blob.x, reach, WORLD - reach);
      blob.y = clamp(blob.y, reach, WORLD - reach);
      if (blob.mass > 100) blob.mass -= blob.mass * 0.0018 * dt;
      for (let index = this.food.length - 1; index >= 0; index -= 1) {
        const dot = this.food[index];
        if (!dot || Math.abs(blob.x - dot.x) > reach || Math.abs(blob.y - dot.y) > reach) continue;
        if (Math.hypot(blob.x - dot.x, blob.y - dot.y) >= reach) continue;
        if (this.mode === "playing" && blob.owner === 0 && this.activeLevel.id === "slalom" && dot.mass === 1) {
          this.levelProgress += 1;
          massChanged = true;
        }
        blob.mass += dot.mass;
        if (blob.owner === 0 && Math.random() < 0.08) this.beep(400 + rand(0, 200));
        this.food.splice(index, 1);
      }
      if (this.mode === "playing") {
        for (const shape of this.triangles) {
          if (shape.cooldown > 0 || Math.hypot(blob.x - shape.x, blob.y - shape.y) >= radius(blob.mass)) continue;
          blob.mass *= 1.05;
          shape.cooldown = TRIANGLE_RESPAWN;
          massChanged = true;
          const grown = radius(blob.mass);
          blob.x = clamp(blob.x, grown, WORLD - grown);
          blob.y = clamp(blob.y, grown, WORLD - grown);
          if (blob.owner === 0) {
            if (this.activeLevel.id === "triangles") this.levelProgress += 1;
            this.notify("Triangle! +5% mass");
            this.beep(880);
          }
        }
        for (const shape of this.squares) {
          if (shape.cooldown > 0 || Math.hypot(blob.x - shape.x, blob.y - shape.y) >= radius(blob.mass)) continue;
          blob.mass *= 0.95;
          shape.cooldown = SQUARE_RESPAWN;
          massChanged = true;
          if (blob.owner === 0) {
            if (this.activeLevel.id === "slalom") {
              this.levelProgress = 0;
              this.levelMistakes += 1;
              this.notify("Square! \u22125% mass. Dot count reset.");
            } else {
              this.notify("Square! \u22125% mass");
            }
            this.beep(220);
          }
        }
      }
    }
    if (this.mode === "playing" && this.activeLevel.id === "diamonds") {
      for (const gem of this.diamonds) {
        if (gem.collected || !this.cells.some((blob) => blob.owner === 0 && Math.hypot(blob.x - gem.x, blob.y - gem.y) < radius(blob.mass) + gem.r * 0.3)) {
          continue;
        }
        gem.collected = true;
        this.levelProgress += 1;
        massChanged = true;
        this.notify(
          this.levelProgress === this.activeLevel.goal
            ? "All keys found! Enter the purple portal."
            : `Diamond key! ${this.levelProgress} / ${this.activeLevel.goal}`,
        );
        this.beep(620);
      }
    }
    const removed = new Set<Cell>();
    for (let i = 0; i < this.cells.length; i += 1) {
      const left = this.cells[i];
      if (!left || removed.has(left)) continue;
      for (let j = i + 1; j < this.cells.length; j += 1) {
        const right = this.cells[j];
        if (!right || removed.has(right)) continue;
        const leftRadius = radius(left.mass);
        const rightRadius = radius(right.mass);
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.hypot(dx, dy);
        if (left.owner === right.owner) {
          if (distance < leftRadius + rightRadius && Math.abs(left.vx) + Math.abs(right.vx) < 90) {
            const push = (leftRadius + rightRadius - distance) * 0.12;
            const nx = distance ? dx / distance : 1;
            const ny = distance ? dy / distance : 0;
            left.x -= nx * push;
            left.y -= ny * push;
            right.x += nx * push;
            right.y += ny * push;
          }
          continue;
        }
        const big = left.mass > right.mass ? left : right;
        const small = big === left ? right : left;
        const protectedSpawn = this.elapsed < 3 && (small.owner === 0 || big.owner === 0);
        if (!protectedSpawn && big.mass > small.mass && distance < radius(big.mass) - radius(small.mass) * 0.45) {
          big.mass += small.mass * 0.9;
          removed.add(small);
          this.particles.push({ x: small.x, y: small.y, r: radius(small.mass), color: small.color, life: 1 });
          if (big.owner === 0) {
            this.eaten += 1;
            this.beep(750);
            this.notify(`Nom! +${Math.floor(small.mass * 0.9)} mass`);
          }
          if (small === left) break;
        }
      }
    }
    this.cells = this.cells.filter((blob) => !removed.has(blob));
    for (const blob of removed) {
      if (blob.owner !== 0) {
        this.cells.push(cell(blob.owner, rand(70, WORLD - 70), rand(70, WORLD - 70), rand(16, 55), blob.color, blob.name));
      }
    }
    while (this.food.length < FOOD_COUNT) this.food.push(pellet());
    this.particles = this.particles.filter((spark) => (spark.life -= dt * 2) > 0);
    if (this.mode === "playing") {
      const mine = this.cells.filter((blob) => blob.owner === 0);
      if (mine.length === 0) {
        this.dead();
        return;
      }
      const total = mine.reduce((sum, blob) => sum + blob.mass, 0);
      this.peak = Math.max(this.peak, total);
      const centerX = mine.reduce((sum, blob) => sum + blob.x * blob.mass, 0) / total;
      const centerY = mine.reduce((sum, blob) => sum + blob.y * blob.mass, 0) / total;
      this.camera.x += (centerX - this.camera.x) * Math.min(1, dt * 5);
      this.camera.y += (centerY - this.camera.y) * Math.min(1, dt * 5);
      const zoom = clamp(1.2 - Math.log2(total / 20) * 0.12, 0.38, 1.2);
      this.camera.zoom += (zoom - this.camera.zoom) * Math.min(1, dt * 2);
    } else {
      this.camera.x = WORLD / 2 + Math.sin(this.elapsed * 0.04) * 200;
      this.camera.y = WORLD / 2;
      this.elapsed += dt;
    }
    if (massChanged) this.updateHud();
    this.checkLevelComplete();
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    this.drawSpace();
    const zoom = this.camera.zoom;
    ctx.save();
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.camera.x, -this.camera.y);
    const left = this.camera.x - this.w / 2 / zoom;
    const top = this.camera.y - this.h / 2 / zoom;
    const right = left + this.w / zoom;
    const bottom = top + this.h / zoom;
    ctx.strokeStyle = "#8baded09";
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = Math.floor(left / 60) * 60; x < right; x += 60) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = Math.floor(top / 60) * 60; y < bottom; y += 60) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "#c9f69540";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, WORLD, WORLD);
    for (const dot of this.food) {
      if (dot.x < left || dot.x > right || dot.y < top || dot.y > bottom) continue;
      ctx.fillStyle = dot.color;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const shape of this.triangles) {
      if (shape.cooldown > 0 || shape.x + shape.r < left || shape.x - shape.r > right || shape.y + shape.r < top || shape.y - shape.r > bottom) continue;
      this.drawTriangle(shape);
    }
    for (const shape of this.squares) {
      if (shape.cooldown > 0 || shape.x + shape.r < left || shape.x - shape.r > right || shape.y + shape.r < top || shape.y - shape.r > bottom) continue;
      this.drawSquare(shape);
    }
    for (const gem of this.diamonds) {
      if (gem.collected || gem.x + gem.r < left || gem.x - gem.r > right || gem.y + gem.r < top || gem.y - gem.r > bottom) continue;
      this.drawDiamond(gem);
    }
    if (this.portal) this.drawPortal(this.portal);
    for (const blob of [...this.cells].sort((a, b) => a.mass - b.mass)) {
      const reach = radius(blob.mass);
      if (blob.x + reach < left || blob.x - reach > right || blob.y + reach < top || blob.y - reach > bottom) continue;
      this.drawBlob(blob);
    }
    for (const spark of this.particles) {
      ctx.globalAlpha = spark.life;
      ctx.strokeStyle = spark.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.r + (1 - spark.life) * 35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    this.drawPlayerMarkers();
    if (this.mode !== "menu") return;
    const fade = ctx.createLinearGradient(0, 0, this.w, 0);
    fade.addColorStop(0, "#090f25f0");
    fade.addColorStop(0.32, "#090f25d9");
    fade.addColorStop(0.58, "#090f2555");
    fade.addColorStop(1, "#090f2500");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, this.w, this.h);
    if (this.w <= 850) return;
    const time = performance.now() / 1000;
    ctx.save();
    ctx.translate(this.w * 0.73, this.h * 0.43);
    ctx.rotate(Math.sin(time) * 0.06);
    this.drawBlob({ x: 0, y: Math.sin(time) * 8, mass: 650, color: "#c9f695", owner: -1, name: "big dreams", target: { x: 1, y: -1 } });
    ctx.restore();
    ctx.save();
    ctx.translate(this.w * 0.91, this.h * 0.63);
    this.drawBlob({ x: 0, y: 0, mass: 85, color: "#bfa6ff", owner: -1, name: "bloop", target: { x: -1, y: 0 } });
    ctx.restore();
  }

  private drawSpace() {
    const ctx = this.ctx;
    ctx.drawImage(this.spaceCanvas, 0, 0);
    const time = this.reducedMotion ? 0 : performance.now() / 1000;
    for (const star of this.stars) {
      const x = ((star.x * this.w - this.camera.x * star.depth) % this.w + this.w) % this.w;
      const y = ((star.y * this.h - this.camera.y * star.depth) % this.h + this.h) % this.h;
      ctx.globalAlpha = 0.3 + (Math.sin(time * 0.65 + star.phase) + 1) * 0.2;
      ctx.fillStyle = star.r > 1 ? "#d5ddff" : "#8ebdda";
      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
      if (star.r > 1) {
        ctx.strokeStyle = "#bdccff";
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x, y + 3);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawBlob(blob: Pick<Cell, "owner" | "x" | "y" | "mass" | "color" | "name" | "target">) {
    const ctx = this.ctx;
    const reach = radius(blob.mass);
    const x = blob.x;
    const y = blob.y;
    ctx.save();
    ctx.fillStyle = blob.color;
    ctx.shadowColor = `${blob.color}28`;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(x, y, reach, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff33";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff23";
    ctx.beginPath();
    ctx.ellipse(x - reach * 0.28, y - reach * 0.4, reach * 0.34, reach * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fill();
    const look = blob.owner === 0
      ? this.aim(blob)
      : { dx: blob.target ? blob.target.x - x : 1, dy: blob.target ? blob.target.y - y : 0 };
    const angle = Math.atan2(look.dy, look.dx);
    const lx = Math.cos(angle) * reach * 0.05;
    const ly = Math.sin(angle) * reach * 0.05;
    for (const offset of [-0.2, 0.2]) {
      ctx.fillStyle = "#fafff5";
      ctx.beginPath();
      ctx.ellipse(x + reach * offset, y - reach * 0.15, reach * 0.105, reach * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e3033";
      ctx.beginPath();
      ctx.ellipse(x + reach * offset + lx, y - reach * 0.15 + ly, reach * 0.047, reach * 0.077, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#142630";
    ctx.font = this.font(600, Math.max(9, Math.min(19, reach * 0.23)));
    ctx.fillText(blob.name, x, y + reach * 0.28);
    if (this.mode === "playing" || this.mode === "paused" || this.mode === "complete") {
      ctx.font = this.font(600, Math.max(9, Math.min(24, reach * 0.2)));
      ctx.fillStyle = "#142630";
      ctx.fillText(String(Math.floor(blob.mass)), x, y + reach * 0.68);
    }
    ctx.restore();
  }

  private drawTriangle(shape: Shape) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.shadowColor = "#ffc97880";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffd58e";
    ctx.strokeStyle = "#fff0cf";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -shape.r);
    ctx.lineTo(shape.r * 0.87, shape.r * 0.5);
    ctx.lineTo(-shape.r * 0.87, shape.r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#6b4618";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = this.font(700, 12);
    ctx.fillText("+", 0, 0);
    ctx.fillStyle = "#ffe3b3";
    ctx.font = this.font(700, Math.max(10, 10 / this.camera.zoom));
    ctx.fillText("+5%", 0, shape.r + 12 / this.camera.zoom);
    ctx.restore();
  }

  private drawSquare(shape: Shape) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.shadowColor = "#ff809680";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff9aa9";
    ctx.strokeStyle = "#ffe0e6";
    ctx.lineWidth = 1.5;
    ctx.fillRect(-shape.r, -shape.r, shape.r * 2, shape.r * 2);
    ctx.strokeRect(-shape.r, -shape.r, shape.r * 2, shape.r * 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#702538";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = this.font(700, 15);
    ctx.fillText("\u2212", 0, 0);
    ctx.fillStyle = "#ffc2ce";
    ctx.font = this.font(700, Math.max(10, 10 / this.camera.zoom));
    ctx.fillText("\u22125%", 0, shape.r + 12 / this.camera.zoom);
    ctx.restore();
  }

  private drawDiamond(gem: Diamond) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.shadowColor = "#79dbff99";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#83e4ff";
    ctx.strokeStyle = "#e6fbff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -gem.r);
    ctx.lineTo(gem.r, 0);
    ctx.lineTo(0, gem.r);
    ctx.lineTo(-gem.r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#183c57";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = this.font(700, 13);
    ctx.fillText("\u25c6", 0, 0);
    ctx.fillStyle = "#b9efff";
    ctx.font = this.font(700, Math.max(10, 10 / this.camera.zoom));
    ctx.fillText("KEY", 0, gem.r + 12 / this.camera.zoom);
    ctx.restore();
  }

  private drawPortal(gate: Portal) {
    const ctx = this.ctx;
    const ready = this.levelProgress >= this.activeLevel.goal;
    ctx.save();
    ctx.translate(gate.x, gate.y);
    ctx.shadowColor = "#b6a2ff";
    ctx.shadowBlur = ready ? 26 : 12;
    ctx.lineWidth = 4;
    ctx.strokeStyle = ready ? "#d5c6ff" : "#8973cb";
    ctx.fillStyle = "#9681ef18";
    ctx.beginPath();
    ctx.arc(0, 0, gate.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, gate.r + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = this.font(700, 10);
    ctx.fillStyle = "#e4daff";
    ctx.fillText(ready ? "ENTER" : "LOCKED", 0, 0);
    ctx.font = this.font(700, Math.max(10, 10 / this.camera.zoom));
    ctx.fillText(ready ? "PORTAL" : "3 keys to open", 0, gate.r + 23 / this.camera.zoom);
    ctx.restore();
  }

  private drawPlayerMarkers() {
    if (this.mode !== "playing" && this.mode !== "paused" && this.mode !== "complete") return;
    const ctx = this.ctx;
    for (const blob of this.cells.filter((piece) => piece.owner === 0)) {
      const x = (blob.x - this.camera.x) * this.camera.zoom + this.w / 2;
      const y = (blob.y - this.camera.y) * this.camera.zoom + this.h / 2;
      const reach = radius(blob.mass) * this.camera.zoom;
      ctx.save();
      ctx.shadowColor = blob.color;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, reach + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const labelY = y - reach - 28;
      ctx.fillStyle = "#091225e8";
      ctx.fillRect(x - 23, labelY - 11, 46, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = this.font(700, 11);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("YOU", x, labelY);
      ctx.beginPath();
      ctx.moveTo(x - 4, labelY + 12);
      ctx.lineTo(x + 4, labelY + 12);
      ctx.lineTo(x, labelY + 17);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private updateHud() {
    if (this.mode !== "playing" && this.mode !== "paused") return;
    this.updateLevelHud();
    const totals = new Map<number, { name: string; mass: number; color: string; owner: number }>();
    for (const blob of this.cells) {
      const score = totals.get(blob.owner) ?? { name: blob.name, mass: 0, color: blob.color, owner: blob.owner };
      score.mass += blob.mass;
      totals.set(blob.owner, score);
    }
    const sorted = [...totals.values()].sort((a, b) => b.mass - a.mass);
    const mine = totals.get(0);
    const rank = sorted.findIndex((score) => score.owner === 0) + 1;
    this.refs.mass.textContent = String(Math.floor(mine?.mass ?? 0));
    this.refs.best.textContent = String(Math.max(this.best, Math.floor(this.peak)));
    this.refs.time.textContent = this.formatTime(this.elapsed);
    this.refs.rank.textContent = `YOU #${rank}`;
    this.refs.boardToggleRank.textContent = `#${rank}`;
    const top = sorted.slice(0, 5);
    if (rank > 5 && mine) top.push(mine);
    this.refs.leaders.replaceChildren(
      ...top.map((score) => {
        const item = document.createElement("li");
        if (score.owner === 0) item.className = rank > 5 ? "me pinned" : "me";
        const place = document.createElement("span");
        place.className = "place";
        place.textContent = String(sorted.indexOf(score) + 1);
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = score.color;
        const name = document.createElement("span");
        name.className = "who";
        name.textContent = score.owner === 0 ? `${score.name} (you)` : score.name;
        const points = document.createElement("span");
        points.className = "points";
        points.textContent = String(Math.floor(score.mass));
        item.append(place, dot, name, points);
        return item;
      }),
    );
    const count = this.cells.filter((blob) => blob.owner === 0).length;
    this.refs.join.disabled = count < 2;
    this.refs.hint.textContent = this.elapsed < 3
      ? "Safe start — find some food!"
      : count > 1
        ? `J or Join: ${count} → ${Math.ceil(count / 2)} blobs.`
        : (mine?.mass ?? 0) >= 36
          ? "Space to split. Go catch a smaller rival."
          : "Triangles +5%. Squares \u22125%.";
    this.mini.clearRect(0, 0, 144, 144);
    for (const blob of this.cells) {
      this.mini.fillStyle = blob.owner === 0 ? "#c9f695" : "#627782";
      this.mini.beginPath();
      this.mini.arc((blob.x / WORLD) * 144, (blob.y / WORLD) * 144, blob.owner === 0 ? 4 : 2, 0, Math.PI * 2);
      this.mini.fill();
    }
    for (const gem of this.diamonds) {
      if (gem.collected) continue;
      this.mini.fillStyle = "#83e4ff";
      this.mini.beginPath();
      this.mini.arc((gem.x / WORLD) * 144, (gem.y / WORLD) * 144, 3, 0, Math.PI * 2);
      this.mini.fill();
    }
    if (this.portal) {
      this.mini.strokeStyle = "#c9b5ff";
      this.mini.lineWidth = 2;
      this.mini.beginPath();
      this.mini.arc((this.portal.x / WORLD) * 144, (this.portal.y / WORLD) * 144, 4, 0, Math.PI * 2);
      this.mini.stroke();
    }
    this.mini.strokeStyle = "#ffffff25";
    this.mini.lineWidth = 1;
    this.mini.strokeRect(
      clamp(((this.camera.x - this.w / 2 / this.camera.zoom) / WORLD) * 144, 0, 144),
      clamp(((this.camera.y - this.h / 2 / this.camera.zoom) / WORLD) * 144, 0, 144),
      Math.min(144, (this.w / this.camera.zoom / WORLD) * 144),
      Math.min(144, (this.h / this.camera.zoom / WORLD) * 144),
    );
    if (this.peak > this.best) {
      this.best = Math.floor(this.peak);
      try {
        localStorage.setItem("blobber-best", String(this.best));
      } catch {
        // Storage can be blocked; the score still updates on screen.
      }
    }
  }

  private notify(message: string) {
    this.refs.toast.textContent = message;
    this.refs.toast.classList.add("show");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.refs.toast.classList.remove("show"), 2300);
  }

  private formatTime(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  private font(weight: number, size: number) {
    return `${weight} ${size}px Outfit, sans-serif`;
  }

  private setHelpOpen(open: boolean) {
    if (this.disposed) return;
    const visible = !this.refs.help.classList.contains("hidden");
    if (open === visible) return;
    if (open) {
      this.helpHeldPlay = this.mode === "playing";
      if (this.helpHeldPlay) {
        this.mode = "paused";
        this.keys = {};
        this.pointer.active = false;
      }
      this.refs.help.classList.remove("hidden");
      this.refs.helpOpen.setAttribute("aria-expanded", "true");
      this.refs.helpClose.focus();
      return;
    }
    this.refs.help.classList.add("hidden");
    this.refs.helpOpen.setAttribute("aria-expanded", "false");
    const resume = this.helpHeldPlay && this.mode === "paused";
    this.helpHeldPlay = false;
    if (resume) {
      this.keys = {};
      this.pointer.active = false;
      this.mode = "playing";
      this.releaseFocus();
      return;
    }
    this.refs.helpOpen.focus();
  }

  private hideHelp() {
    this.helpHeldPlay = false;
    this.refs.help.classList.add("hidden");
    this.refs.helpOpen.setAttribute("aria-expanded", "false");
  }

  private releaseFocus() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  private setLeaderboardOpen(open: boolean) {
    this.leaderboardOpen = open;
    this.refs.leaderboard.classList.toggle("hidden", !open);
    this.refs.leaderboardToggle.setAttribute("aria-expanded", String(open));
    this.refs.leaderboardToggle.setAttribute("aria-label", open ? "Hide leaderboard" : "Show leaderboard");
  }

  private toggleSound() {
    this.releaseFocus();
    this.sound = !this.sound;
    this.refs.soundMark.textContent = this.sound ? "" : "×";
    this.refs.sound.setAttribute("aria-label", this.sound ? "Turn sound effects off" : "Turn sound effects on");
    if (this.sound) this.beep();
  }

  private beep(frequency = 450) {
    if (!this.sound) return;
    try {
      this.audioCtx = this.audioCtx ?? audioContext();
      if (!this.audioCtx) return;
      const oscillator = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      oscillator.connect(gain);
      gain.connect(this.audioCtx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + 0.1);
    } catch {
      // A missing audio device should not stop the round.
    }
  }

  private updateMusicButton() {
    const label = this.musicEnabled ? "Turn background music off" : "Turn background music on";
    this.refs.music.setAttribute("aria-pressed", String(this.musicEnabled));
    this.refs.music.setAttribute("aria-label", label);
    this.refs.music.setAttribute("title", label);
    this.refs.music.classList.toggle("active", this.musicEnabled);
  }

  private playMusicNote(note: number, at: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.audioCtx || !this.musicGain) return;
    const oscillator = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(440 * 2 ** ((note - 69) / 12), at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(this.musicGain);
    const voice = { oscillator, gain };
    this.musicVoices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.musicVoices.delete(voice);
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
  }

  private scheduleMusic = () => {
    if (!this.musicEnabled || document.hidden || !this.audioCtx || this.audioCtx.state !== "running" || !this.musicGain) return;
    this.nextMusicNote = Math.max(this.nextMusicNote, this.audioCtx.currentTime + 0.025);
    while (this.nextMusicNote < this.audioCtx.currentTime + 0.45) {
      const index = this.musicStep % MUSIC_MELODY.length;
      const note = MUSIC_MELODY[index];
      if (note != null) this.playMusicNote(note - 12, this.nextMusicNote, MUSIC_BEAT * 0.88, "triangle", 0.09);
      if (index % 2 === 0) {
        const bass = (MUSIC_BASS[Math.floor(index / 8)] ?? 48) + (index % 8 === 4 ? 7 : 0);
        this.playMusicNote(bass, this.nextMusicNote, MUSIC_BEAT * 1.4, "sine", 0.085);
      }
      this.musicStep += 1;
      this.nextMusicNote += MUSIC_BEAT;
    }
  };

  private stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.audioCtx) {
      const previous = this.musicGain;
      previous.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.02);
      window.setTimeout(() => previous.disconnect(), 120);
      this.musicGain = null;
    }
    for (const voice of this.musicVoices) {
      try {
        voice.oscillator.stop((this.audioCtx?.currentTime ?? 0) + 0.1);
      } catch {
        // The voice may already have ended.
      }
    }
    this.musicVoices.clear();
  }

  private async beginMusic(request: number) {
    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = audioContext();
        if (!this.audioCtx) throw new Error("Audio unavailable");
      }
      if (this.audioCtx.state !== "running") await this.audioCtx.resume();
      if (this.disposed || request !== this.musicRun || !this.musicEnabled || document.hidden) return;
      if (this.audioCtx.state !== "running") throw new Error("Audio unavailable");
      this.musicGain = this.audioCtx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.audioCtx.destination);
      this.musicStep = 0;
      this.nextMusicNote = this.audioCtx.currentTime + 0.05;
      this.scheduleMusic();
      this.musicTimer = window.setInterval(this.scheduleMusic, 100);
    } catch {
      if (request === this.musicRun) {
        this.stopMusic();
        this.musicEnabled = false;
        this.updateMusicButton();
        this.notify("Background music is unavailable in this browser.");
      }
    }
  }

  private async toggleMusic() {
    this.releaseFocus();
    this.musicEnabled = !this.musicEnabled;
    const request = ++this.musicRun;
    this.updateMusicButton();
    this.stopMusic();
    if (this.musicEnabled) await this.beginMusic(request);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !this.refs.help.classList.contains("hidden")) {
      event.preventDefault();
      this.setHelpOpen(false);
      return;
    }
    const tag = document.activeElement?.tagName;
    if ((tag === "INPUT" || tag === "SELECT" || tag === "BUTTON") && this.mode === "menu") return;
    if (
      (event.key === " " || event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      this.mode !== "menu"
    ) {
      event.preventDefault();
    }
    if (event.key === "Escape") {
      if (this.leaderboardOpen) {
        event.preventDefault();
        this.setLeaderboardOpen(false);
        this.releaseFocus();
      } else {
        this.pause();
      }
      return;
    }
    if (this.mode !== "playing") return;
    const key = event.key.toLowerCase();
    if (key === "w" || key === "a" || key === "s" || key === "d" || key === "j") event.preventDefault();
    this.keys[key.startsWith("arrow") ? event.key : key] = true;
    if (!event.repeat) {
      if (event.key === " ") this.split();
      if (key === "w") this.eject();
      if (key === "j") this.join();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys[event.key] = false;
    this.keys[event.key.toLowerCase()] = false;
  };

  private readonly onBlur = () => {
    if (this.mode === "playing") this.pause();
  };

  private readonly onVisibility = () => {
    if (document.hidden) {
      this.musicRun += 1;
      this.stopMusic();
      if (this.mode === "playing") this.pause();
      return;
    }
    if (this.musicEnabled) void this.beginMusic(++this.musicRun);
  };

  private pointerPoint(event: PointerEvent) {
    const bounds = this.canvas.getBoundingClientRect();
    const width = bounds.width || this.w || 1;
    const height = bounds.height || this.h || 1;
    return {
      x: ((event.clientX - bounds.left) * (this.w || width)) / width,
      y: ((event.clientY - bounds.top) * (this.h || height)) / height,
    };
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const point = this.pointerPoint(event);
    this.pointer = { x: point.x, y: point.y, active: true };
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    this.setLeaderboardOpen(false);
    const point = this.pointerPoint(event);
    this.pointer = { x: point.x, y: point.y, active: true };
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can end before the canvas accepts it.
    }
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") this.pointer.active = false;
  };

  private readonly onPointerCancel = () => {
    this.pointer.active = false;
  };
}
