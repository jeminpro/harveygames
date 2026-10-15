import { useLiveQuery } from "dexie-react-hooks";
import { GameCard } from "../components/game-card";
import { getDb } from "../db/client";
import { catalog } from "../games/catalog";
import { absoluteUrl, siteDescription, siteName, siteUrl } from "../site";

const pageTitle = siteName;

export function meta() {
  const image = absoluteUrl("logo.png");
  return [
    { title: pageTitle },
    { name: "description", content: siteDescription },
    { name: "application-name", content: siteName },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: siteUrl },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: siteDescription },
    { property: "og:url", content: siteUrl },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteName },
    { property: "og:image", content: image },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: pageTitle },
    { name: "twitter:description", content: siteDescription },
    { name: "twitter:image", content: image },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${siteUrl}#website`,
            name: siteName,
            url: siteUrl,
            description: siteDescription,
            inLanguage: "en",
            publisher: { "@id": `${siteUrl}#organization` },
          },
          {
            "@type": "Organization",
            "@id": `${siteUrl}#organization`,
            name: siteName,
            url: siteUrl,
            logo: image,
          },
          {
            "@type": "ItemList",
            name: "Harvey Games catalog",
            itemListElement: catalog.map((game) => ({
              "@type": "ListItem",
              position: game.order,
              name: game.title,
              url: absoluteUrl(`play/${game.id}/`),
            })),
          },
        ],
      },
    },
  ];
}

export default function Home() {
  const liveGames = useLiveQuery(() => getDb().games.orderBy("order").toArray());
  const currentIds = new Set(catalog.map((game) => game.id));
  const savedGames = (liveGames ?? catalog).filter((game) => currentIds.has(game.id));
  const games = savedGames.length > 0 ? savedGames : catalog;

  return (
    <main className="library">
      <div className="library-intro">
        <p className="eyebrow">Free in the browser</p>
        <h1>{siteName}</h1>
        <p>{siteDescription}</p>
      </div>
      <ul className="grid">
        {games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
      </ul>
    </main>
  );
}
