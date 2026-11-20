function createTagChip({ key, label, count, isSelected }) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "tag-chip";
  chip.dataset.tagKey = key;
  chip.setAttribute("aria-pressed", String(isSelected));

  const countElement = document.createElement("span");
  countElement.className = "tag-chip-count";
  countElement.textContent = String(count);

  chip.append(`#${label}`, countElement);
  return chip;
}

function createResetChip() {
  const resetChip = document.createElement("button");
  resetChip.type = "button";
  resetChip.className = "tag-chip tag-chip-reset";
  resetChip.dataset.tagAction = "reset";
  resetChip.textContent = "✕ Сбросить";
  return resetChip;
}

export function renderTagFilter({ container, tagCounts, selectedTagKeys }) {
  const visibleTags = tagCounts.filter((tag) => tag.count > 0 || selectedTagKeys.has(tag.key));
  if (visibleTags.length === 0) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();
  if (selectedTagKeys.size > 0) fragment.append(createResetChip());
  visibleTags.forEach((tag) => fragment.append(createTagChip({ ...tag, isSelected: selectedTagKeys.has(tag.key) })));
  container.replaceChildren(fragment);
  container.hidden = false;
}
