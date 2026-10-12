export type GameRecord = {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  order: number;
};

export const catalog: GameRecord[] = [
  {
    id: "blobber",
    title: "Blobber",
    tagline: "Small blob. Big appetite.",
    genre: "Arcade",
    order: 1,
  },
  {
    id: "rustwing",
    title: "Flight Simulator",
    tagline: "A wreck that still flies.",
    genre: "Flight",
    order: 2,
  },
];

export function findGame(gameId: string | undefined) {
  return catalog.find((game) => game.id === gameId);
}
