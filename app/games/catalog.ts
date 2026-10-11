export type GameRecord = {
  id: string;
  title: string;
  tagline: string;
  order: number;
};

export const catalog: GameRecord[] = [
  {
    id: "signal",
    title: "Signal Run",
    tagline: "Thread a pulse through a dark grid.",
    order: 1,
  },
  {
    id: "drift",
    title: "Night Drift",
    tagline: "Hold the racing line through neon corners.",
    order: 2,
  },
  {
    id: "vault",
    title: "Vault Circuit",
    tagline: "Crack the lock before the lights drop.",
    order: 3,
  },
];

export function findGame(gameId: string | undefined) {
  return catalog.find((game) => game.id === gameId);
}
