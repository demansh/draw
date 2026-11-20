import { parseYoutubeLink } from "./youtube-links.js";
import { loadYoutubeApi } from "./youtube-api.js";
import { pauseInlinePlayers, renderFeed } from "./feed.js";
import { createViewer } from "./viewer.js";

const FILTER_QUERY_PARAM = "type";
const DEFAULT_FILTER = "all";

const FILTERS = {
  all: { matches: () => true, emptyMessage: "Пока нет видео. Добавьте ссылки в videos.js" },
  shorts: { matches: (video) => video.format === "portrait", emptyMessage: "Пока нет Shorts" },
  videos: { matches: (video) => video.format === "landscape", emptyMessage: "Пока нет полных видео" },
};

function readVideos() {
  const rawLinks = typeof VIDEO_LINKS !== "undefined" && Array.isArray(VIDEO_LINKS) ? VIDEO_LINKS : [];
  const videos = [];
  rawLinks.forEach((link) => {
    const parsedVideo = parseYoutubeLink(link);
    if (parsedVideo) videos.push({ ...parsedVideo, position: videos.length + 1 });
    else console.warn("Не удалось распознать ссылку на YouTube:", link);
  });
  return videos;
}

function readFilterFromUrl() {
  const filterName = new URLSearchParams(location.search).get(FILTER_QUERY_PARAM);
  return Object.hasOwn(FILTERS, filterName) ? filterName : DEFAULT_FILTER;
}

function writeFilterToUrl(filterName) {
  const url = new URL(location.href);
  if (filterName === DEFAULT_FILTER) url.searchParams.delete(FILTER_QUERY_PARAM);
  else url.searchParams.set(FILTER_QUERY_PARAM, filterName);
  history.replaceState(history.state, "", url);
}

const allVideos = readVideos();
const viewer = createViewer({ onOpen: () => pauseInlinePlayers() });
const filterTabs = document.getElementById("filter-tabs");
const feedElements = {
  feed: document.getElementById("feed"),
  template: document.getElementById("video-card-template"),
  counter: document.getElementById("video-count"),
};

function updateFilterTabs(activeFilterName) {
  filterTabs.querySelectorAll("[data-filter]").forEach((tab) => {
    const filterName = tab.dataset.filter;
    tab.setAttribute("aria-pressed", String(filterName === activeFilterName));
    tab.querySelector(".filter-tab-count").textContent = allVideos.filter(FILTERS[filterName].matches).length;
  });
}

function applyFilter(filterName) {
  const filter = FILTERS[filterName];
  const visibleVideos = allVideos.filter(filter.matches);
  updateFilterTabs(filterName);
  renderFeed({
    ...feedElements,
    videos: visibleVideos,
    emptyMessage: filter.emptyMessage,
    onExpand: (index) => viewer.open(visibleVideos, index),
  });
}

filterTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-filter]");
  if (!tab || tab.getAttribute("aria-pressed") === "true") return;
  writeFilterToUrl(tab.dataset.filter);
  applyFilter(tab.dataset.filter);
  window.scrollTo({ top: 0 });
});

applyFilter(readFilterFromUrl());

if (allVideos.length > 0) {
  loadYoutubeApi().catch((error) => console.warn(error.message));
}
