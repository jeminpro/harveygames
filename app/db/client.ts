import Dexie, { type EntityTable } from "dexie";
import { catalog, type GameRecord } from "../games/catalog";

class HarveyDatabase extends Dexie {
  games!: EntityTable<GameRecord, "id">;

  constructor() {
    super("harveygames");
    this.version(1).stores({
      games: "id, order",
    });
  }
}

let database: HarveyDatabase | undefined;

export function getDb() {
  if (!database) {
    database = new HarveyDatabase();
  }
  return database;
}

export async function seedCatalog() {
  const db = getDb();
  const currentIds = new Set(catalog.map((game) => game.id));

  await db.transaction("rw", db.games, async () => {
    const stored = await db.games.toArray();
    const removed = stored
      .filter((game) => !currentIds.has(game.id))
      .map((game) => game.id);
    if (removed.length > 0) {
      await db.games.bulkDelete(removed);
    }
    await db.games.bulkPut(catalog);
  });
}
