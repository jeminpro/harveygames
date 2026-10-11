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
];

export function findGame(gameId: string | undefined) {
  return catalog.find((game) => game.id === gameId);
}
