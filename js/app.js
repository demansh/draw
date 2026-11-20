import { loadYoutubeApi } from "./youtube-api.js";
import { pauseInlinePlayers, renderFeed } from "./feed.js";
import { createViewer } from "./viewer.js";
import { readVideoCatalog } from "./video-catalog.js";
import {
  countTags,
  filterByTags,
  filterByType,
  readFilterStateFromUrl,
  writeFilterStateToUrl,
} from "./filters.js";
import { renderTagFilter } from "./tag-filter.js";

const EMPTY_MESSAGES = {
  noVideos: "Пока нет видео. Добавьте ссылки в videos.js",
  noMatches: "Нет видео с выбранными ключевыми словами",
  noShorts: "Пока нет Shorts",
  noFullVideos: "Пока нет полных видео",
};

const rawEntries = typeof VIDEO_LINKS !== "undefined" ? VIDEO_LINKS : [];
const allVideos = readVideoCatalog(rawEntries);
const tagLabelsByKey = new Map(allVideos.flatMap((video) => video.tags.map((tag) => [tag.key, tag.label])));

const viewer = createViewer({ onOpen: () => pauseInlinePlayers() });
const typeTabs = document.getElementById("filter-tabs");
const tagFilterContainer = document.getElementById("tag-filter");
const feedElements = {
  feed: document.getElementById("feed"),
  template: document.getElementById("video-card-template"),
};

const initialState = readFilterStateFromUrl();
const filterState = {
  type: initialState.type,
  selectedTagKeys: new Set([...initialState.selectedTagKeys].filter((tagKey) => tagLabelsByKey.has(tagKey))),
};

function chooseEmptyMessage(typeVideos) {
  if (allVideos.length === 0) return EMPTY_MESSAGES.noVideos;
  if (typeVideos.length > 0) return EMPTY_MESSAGES.noMatches;
  return filterState.type === "shorts" ? EMPTY_MESSAGES.noShorts : EMPTY_MESSAGES.noFullVideos;
}

function updateTypeTabs() {
  typeTabs.querySelectorAll("[data-filter]").forEach((tab) => {
    const typeName = tab.dataset.filter;
    const matchingCount = filterByTags(filterByType(allVideos, typeName), filterState.selectedTagKeys).length;
    tab.setAttribute("aria-pressed", String(typeName === filterState.type));
    tab.querySelector(".filter-tab-count").textContent = String(matchingCount);
  });
}

function buildTagCounts(visibleVideos) {
  const tagCounts = countTags(visibleVideos);
  const countedKeys = new Set(tagCounts.map((tag) => tag.key));
  filterState.selectedTagKeys.forEach((tagKey) => {
    if (!countedKeys.has(tagKey)) tagCounts.push({ key: tagKey, label: tagLabelsByKey.get(tagKey), count: 0 });
  });
  return tagCounts;
}

function applyFilters() {
  const typeVideos = filterByType(allVideos, filterState.type);
  const visibleVideos = filterByTags(typeVideos, filterState.selectedTagKeys);

  updateTypeTabs();
  renderTagFilter({
    container: tagFilterContainer,
    tagCounts: buildTagCounts(visibleVideos),
    selectedTagKeys: filterState.selectedTagKeys,
  });
  renderFeed({
    ...feedElements,
    videos: visibleVideos,
    emptyMessage: chooseEmptyMessage(typeVideos),
    onExpand: (index) => viewer.open(visibleVideos, index),
  });
}

function commitFilterChange() {
  writeFilterStateToUrl(filterState);
  applyFilters();
  window.scrollTo({ top: 0 });
}

typeTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-filter]");
  if (!tab || tab.dataset.filter === filterState.type) return;
  filterState.type = tab.dataset.filter;
  commitFilterChange();
});

tagFilterContainer.addEventListener("click", (event) => {
  const chip = event.target.closest(".tag-chip");
  if (!chip) return;
  if (chip.dataset.tagAction === "reset") {
    filterState.selectedTagKeys.clear();
  } else if (filterState.selectedTagKeys.has(chip.dataset.tagKey)) {
    filterState.selectedTagKeys.delete(chip.dataset.tagKey);
  } else {
    filterState.selectedTagKeys.add(chip.dataset.tagKey);
  }
  commitFilterChange();
});

writeFilterStateToUrl(filterState);
applyFilters();

if (allVideos.length > 0) {
  loadYoutubeApi().catch((error) => console.warn(error.message));
}
