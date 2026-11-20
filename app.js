(() => {
  "use strict";

  const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
  const YOUTUBE_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
  ]);

  function parseYoutubeLink(rawUrl) {
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

  function buildEmbedUrl(videoId) {
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
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  }

  function sendPlayerCommand(iframe, command) {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "https://www.youtube-nocookie.com",
    );
  }

  const playerRegistry = {
    activeIframe: null,
    pauseAllExcept(iframe) {
      document.querySelectorAll(".video-frame iframe").forEach((candidate) => {
        if (candidate !== iframe) sendPlayerCommand(candidate, "pauseVideo");
      });
      this.activeIframe = iframe;
    },
  };

  function activatePlayer(frameElement, video, label) {
    const iframe = document.createElement("iframe");
    iframe.src = buildEmbedUrl(video.videoId);
    iframe.title = label;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frameElement.replaceChildren(iframe);
    playerRegistry.pauseAllExcept(iframe);
    visibilityObserver.observe(frameElement);
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

  function createVideoCard(template, video, position) {
    const card = template.content.firstElementChild.cloneNode(true);
    const label = `Упражнение ${position}`;
    card.dataset.format = video.format;

    const thumbnail = card.querySelector(".video-thumbnail");
    thumbnail.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
    thumbnail.alt = label;

    const previewButton = card.querySelector(".video-preview");
    previewButton.setAttribute("aria-label", `Смотреть: ${label}`);
    previewButton.addEventListener(
      "click",
      () => activatePlayer(card.querySelector(".video-frame"), video, label),
      { once: true },
    );

    card.querySelector(".video-label").textContent = label;
    card.querySelector(".video-link").href = video.originalUrl;
    return card;
  }

  function showMessage(feed, text) {
    const message = document.createElement("p");
    message.className = "feed-message";
    message.textContent = text;
    feed.replaceChildren(message);
  }

  function renderFeed() {
    const feed = document.getElementById("feed");
    const template = document.getElementById("video-card-template");
    const counter = document.getElementById("video-count");
    const rawLinks = typeof VIDEO_LINKS !== "undefined" && Array.isArray(VIDEO_LINKS) ? VIDEO_LINKS : [];

    const videos = [];
    rawLinks.forEach((link) => {
      const parsed = parseYoutubeLink(link);
      if (parsed) videos.push(parsed);
      else console.warn("Не удалось распознать ссылку на YouTube:", link);
    });

    if (videos.length === 0) {
      counter.textContent = "";
      showMessage(feed, "Пока нет видео. Добавьте ссылки в videos.js");
      return;
    }

    counter.textContent = `${videos.length} видео`;
    const fragment = document.createDocumentFragment();
    videos.forEach((video, index) => fragment.append(createVideoCard(template, video, index + 1)));
    feed.replaceChildren(fragment);
  }

  renderFeed();
})();
