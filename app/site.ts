export const siteName = "Harvey Games";

export const siteUrl = "https://jeminpro.com/harveygames/";

export const siteDescription =
  "Harvey Games is a free browser game cabinet. Play Blobber and Flight Simulator here, with no account and nothing to install.";

export function absoluteUrl(path = "") {
  return new URL(path.replace(/^\//, ""), siteUrl).href;
}
