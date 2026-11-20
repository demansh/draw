export const EMBED_HOST = "https://www.youtube-nocookie.com";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function parseYoutubeLink(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl).trim());
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  const pathSegments = url.pathname.split("/").filter(Boolean);
  let videoId = null;
  let format = "landscape";

  if (url.hostname.endsWith("youtu.be")) {
    videoId = pathSegments[0];
  } else if (pathSegments[0] === "shorts") {
    videoId = pathSegments[1];
    format = "portrait";
  } else if (pathSegments[0] === "watch") {
    videoId = url.searchParams.get("v");
  } else if (pathSegments[0] === "embed" || pathSegments[0] === "live") {
    videoId = pathSegments[1];
  }

  if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) return null;
  return { videoId, format, originalUrl: url.href };
}

export function buildThumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function buildEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    loop: "1",
    playlist: videoId,
  });
  if (location.origin.startsWith("http")) params.set("origin", location.origin);
  return `${EMBED_HOST}/embed/${videoId}?${params}`;
}
