export type GameRecord = {
  id: string;
  title: string;
  tagline: string;
  order: number;
};

export const catalog: GameRecord[] = [
  {
    id: "blobber",
    title: "Blobber",
    tagline: "Small blob. Big appetite.",
    order: 1,
  },
  {
    id: "rustwing",
    title: "Flight Simulator",
    tagline: "A wreck that still flies.",
    order: 2,
  },
];

export function findGame(gameId: string | undefined) {
  return catalog.find((game) => game.id === gameId);
}
