# Harvey Games

A client-only game cabinet. Pick a game and play it in the browser. There is no account and no server database. The catalog lives in IndexedDB on the device.

Published site: [https://jeminpro.com/harveygames/](https://jeminpro.com/harveygames/)

`jeminpro.com` is the custom domain on the user GitHub Pages site, so this project is served from the `/harveygames/` path. Do not add a `CNAME` file to this repo.

## Stack

- React 19.3.0
- React Router 7.18.4, framework mode, `ssr: false`
- Vite 8.3.4
- TypeScript 6.x
- Dexie 4.4.6 for the local catalog
- Phaser 4.2.1 for the playfield

Routes are prerendered: `/` and each `/play/:gameId` from [`app/games/catalog.ts`](app/games/catalog.ts). Add a game by adding a catalog entry. The Pages build prerenders `/play/<id>` from that list.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173/harveygames/](http://localhost:5173/harveygames/).

```bash
npm run build
npm run typecheck
```

## Deploy

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which publishes `build/client` with GitHub Actions. The Pages source for this repo is GitHub Actions.
