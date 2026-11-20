import { EMBED_HOST, buildEmbedUrl, buildThumbnailUrl } from "./youtube-links.js";

function sendPlayerCommand(iframe, command) {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func: command, args: [] }),
    EMBED_HOST,
  );
}

export function pauseInlinePlayers(exceptIframe = null) {
  document.querySelectorAll(".video-frame iframe").forEach((iframe) => {
    if (iframe !== exceptIframe) sendPlayerCommand(iframe, "pauseVideo");
  });
}

const visibilityObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) return;
      const iframe = entry.target.querySelector("iframe");
      if (iframe) sendPlayerCommand(iframe, "pauseVideo");
    });
  },
  { threshold: 0.25 },
);

function activateInlinePlayer(frameElement, video, label) {
  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(video.videoId);
  iframe.title = label;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  frameElement.replaceChildren(iframe);
  pauseInlinePlayers(iframe);
  visibilityObserver.observe(frameElement);
}

function createVideoCard(template, video, index, onExpand) {
  const card = template.content.firstElementChild.cloneNode(true);
  const label = `Упражнение ${video.position}`;
  card.dataset.format = video.format;

  const thumbnail = card.querySelector(".video-thumbnail");
  thumbnail.src = buildThumbnailUrl(video.videoId);
  thumbnail.alt = label;

  const previewButton = card.querySelector(".video-preview");
  previewButton.setAttribute("aria-label", `Смотреть: ${label}`);
  previewButton.addEventListener(
    "click",
    () => activateInlinePlayer(card.querySelector(".video-frame"), video, label),
    { once: true },
  );

  card.querySelector(".video-expand").addEventListener("click", () => onExpand(index));
  card.querySelector(".video-link").href = video.originalUrl;
  return card;
}

function showFeedMessage(feed, text) {
  const message = document.createElement("p");
  message.className = "feed-message";
  message.textContent = text;
  feed.replaceChildren(message);
}

export function renderFeed({ feed, template, videos, emptyMessage, onExpand }) {
  visibilityObserver.disconnect();

  if (videos.length === 0) {
    showFeedMessage(feed, emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  videos.forEach((video, index) => fragment.append(createVideoCard(template, video, index, onExpand)));
  feed.replaceChildren(fragment);
}
