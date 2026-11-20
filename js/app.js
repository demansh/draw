import { parseYoutubeLink } from "./youtube-links.js";
import { loadYoutubeApi } from "./youtube-api.js";
import { pauseInlinePlayers, renderFeed } from "./feed.js";
import { createViewer } from "./viewer.js";

function readVideos() {
  const rawLinks = typeof VIDEO_LINKS !== "undefined" && Array.isArray(VIDEO_LINKS) ? VIDEO_LINKS : [];
  const videos = [];
  rawLinks.forEach((link) => {
    const parsedVideo = parseYoutubeLink(link);
    if (parsedVideo) videos.push(parsedVideo);
    else console.warn("Не удалось распознать ссылку на YouTube:", link);
  });
  return videos;
}

const videos = readVideos();
const viewer = createViewer({ videos, onOpen: () => pauseInlinePlayers() });

renderFeed({
  feed: document.getElementById("feed"),
  template: document.getElementById("video-card-template"),
  counter: document.getElementById("video-count"),
  videos,
  onExpand: (index) => viewer.open(index),
});

if (videos.length > 0) {
  loadYoutubeApi().catch((error) => console.warn(error.message));
}
