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
  await getDb().games.bulkPut(catalog);
}
