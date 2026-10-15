/* global skWatchSetting */
/* exported skShortsToWatchUrl */

// "/shorts/<id>" -> "/watch?v=<id>", or null when the URL is not a Short.
function skShortsToWatchUrl(href) {
  const url = new URL(href);
  const match = url.pathname.match(/^\/shorts\/([\w-]+)/);
  if (!match) return null;
  url.pathname = "/watch";
  url.search = "";
  url.searchParams.set("v", match[1]);
  return url.href;
}

(() => {
  let enabled = false;

  const redirectIfShort = () => {
    if (!enabled) return;
    const target = skShortsToWatchUrl(location.href);
    if (target) location.replace(target);
  };

  skWatchSetting("hideYoutubeShorts", "sk-hide-shorts", (on) => {
    enabled = on;
    redirectIfShort();
  });

  // YouTube is a SPA: catch in-app navigations to /shorts/ as well.
  document.addEventListener("yt-navigate-finish", redirectIfShort);
  window.addEventListener("popstate", redirectIfShort);
})();
