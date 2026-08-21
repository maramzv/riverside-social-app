import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const typePills = document.getElementById("type-pills");
const itemCombobox = document.getElementById("item-combobox");
const itemSearchInput = document.getElementById("item-search");
const itemList = document.getElementById("item-list");
const detailsBox = document.getElementById("item-details");

const platformPills = document.getElementById("platform-pills");
const assetPills = document.getElementById("asset-pills");
const toneField = document.getElementById("tone-field");
const tonePills = document.getElementById("tone-pills");
const aiGenerateBtn = document.getElementById("ai-generate-btn");

const captionInput = document.getElementById("caption-input");

const uploadField = document.getElementById("upload-field");
const uploadInput = document.getElementById("media-upload");
const uploadLabelText = document.getElementById("upload-label-text");
const clearUploadBtn = document.getElementById("clear-upload-btn");
const uploadError = document.getElementById("upload-error");

const composer = document.getElementById("composer");
const composerPlatformLabel = document.getElementById("composer-platform-label");
const composerMedia = document.getElementById("composer-media");
const composerCaption = document.getElementById("composer-caption");
const composerHashtags = document.getElementById("composer-hashtags");
const imageIdeaLine = document.getElementById("image-idea-line");

const publishModePills = document.getElementById("publish-mode-pills");
const scheduleDateRow = document.getElementById("schedule-date-row");
const postDateInput = document.getElementById("post-date");
const scheduleBtn = document.getElementById("schedule-btn");
const saveStatus = document.getElementById("save-status");

const refreshHistoryBtn = document.getElementById("refresh-history-btn");
const historyTabs = document.getElementById("history-tabs");
const upcomingPanel = document.getElementById("upcoming-panel");
const publishedPanel = document.getElementById("published-panel");
const upcomingBody = document.getElementById("upcoming-body");
const publishedBody = document.getElementById("published-body");
const upcomingCount = document.getElementById("upcoming-count");
const publishedCount = document.getElementById("published-count");

let books = [];
let events = [];
let selectedItem = null;
let platformLinks = {};
let uploadedMediaUrl = null;
let itemListOptions = [];
let itemListActiveIndex = -1;

const PLATFORM_LINK_FIELDS = [
  { field: "instagram_link", label: "Instagram" },
  { field: "tiktok_link", label: "TikTok" },
  { field: "x_link", label: "X" },
  { field: "website_link", label: "Website" },
];

const CAPTION_TEMPLATES = {
  Book: {
    Cozy: [
      ({ title }) => `Curling up with ${title} this weekend. What are you reading?`,
      ({ title }) => `Some stories stay with you. Meet ${title}, on our shelves now.`,
    ],
    Hype: [
      ({ title }) => `IT'S HERE: ${title} just landed at Riverside Books — get in before it's gone!`,
      ({ title }) => `Don't sleep on this one. ${title} is flying off our shelves right now.`,
    ],
    Playful: [
      ({ title }) => `Warning: reading ${title} may cause you to cancel your weekend plans. Ask us how we know.`,
      ({ title }) => `${title} walked into the store and we simply had to keep it.`,
    ],
    "Staff Pick": [
      ({ title }) => `Staff pick of the week: ${title}. Come see why we can't stop recommending it.`,
      ({ title }) => `A quiet favorite: ${title}. Now in stock at Riverside Books.`,
    ],
  },
  Event: {
    Cozy: [
      ({ event_name, event_date }) => `Mark your calendar for ${event_name} on ${formatDate(event_date)}. See you there!`,
    ],
    Hype: [
      ({ event_name, event_date }) => `Tickets are moving for ${event_name} — don't miss it on ${formatDate(event_date)}!`,
      ({ event_name, event_date }) => `Last call: ${event_name} is on ${formatDate(event_date)}. Save your spot now.`,
    ],
    Playful: [
      ({ event_name, event_date }) => `Clear your calendar — ${event_name} is happening ${formatDate(event_date)} and it's going to be a good one.`,
    ],
    "Staff Pick": [
      ({ event_name, event_date }) => `We're personally excited for ${event_name} on ${formatDate(event_date)}. Come say hi!`,
    ],
  },
};

const HASHTAG_BASE = {
  Book: ["#RiversideBooks", "#Bookstagram", "#LocalBookstore"],
  Event: ["#RiversideBooks", "#ShopLocal", "#BookEvents"],
};

const IMAGE_IDEAS = {
  Book: {
    Cozy: "Flatlay of the book with a warm drink and a soft blanket, natural window light.",
    Hype: "Bold close-up of the cover with a 'JUST IN' sticker overlay, high-contrast lighting.",
    Playful: "Candid shot of a staffer mid-laugh holding the book, colorful background.",
    "Staff Pick": "Shelf photo with a handwritten 'staff pick' card tucked next to the book.",
  },
  Event: {
    Cozy: "Soft-focus photo of the event space being set up, string lights in the background.",
    Hype: "Countdown graphic with the event date in bold type over a photo of last year's crowd.",
    Playful: "Short clip of staff prepping decorations, sped up and set to music.",
    "Staff Pick": "Portrait of the host/author with a quote pulled from the event description.",
  },
};

function genreHashtag(genre) {
  if (!genre) return null;
  const slug = genre
    .replace(/'/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");
  return slug ? `#${slug}Reads` : null;
}

function hashtagsFor(type, item) {
  const tags = [...HASHTAG_BASE[type]];
  const genreTag = type === "Book" ? genreHashtag(item.genre) : null;
  if (genreTag) tags.push(genreTag);
  return tags;
}

function imageIdeaFor(type, tone) {
  return IMAGE_IDEAS[type][tone];
}

function genreColor(seed) {
  let hash = 0;
  for (const char of seed || "default") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return `linear-gradient(135deg, hsl(${hue}, 55%, 42%), hsl(${(hue + 40) % 360}, 55%, 30%))`;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function ordinalSuffix(day) {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// Turns "2027-01-31" into "Sunday, January 31st" — nobody posts raw ISO dates on social.
function formatDate(isoDateStr) {
  if (!isoDateStr) return "";
  const [year, month, day] = isoDateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${monthName} ${day}${ordinalSuffix(day)}`;
}

// --- pill groups --------------------------------------------------------

function setupPillGroup(container, onSelect) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn || btn.disabled) return;
    for (const sibling of container.querySelectorAll(".pill")) {
      sibling.classList.remove("selected");
    }
    btn.classList.add("selected");
    onSelect(btn.dataset.value);
  });
}

function selectedPillValue(container) {
  const selected = container.querySelector(".pill.selected");
  return selected ? selected.dataset.value : null;
}

function selectPill(container, value) {
  for (const btn of container.querySelectorAll(".pill")) {
    btn.classList.toggle("selected", btn.dataset.value === value);
  }
}

// --- data loading --------------------------------------------------------

async function loadPickerData() {
  const [{ data: booksData, error: booksErr }, { data: eventsData, error: eventsErr }] =
    await Promise.all([
      supabase.from("Books").select("book_id, title, author, blurb, genre").order("title"),
      supabase.from("Events").select("event_id, event_name, event_date, event_description").order("event_date"),
    ]);

  if (booksErr) console.error("Failed to load Books", booksErr);
  if (eventsErr) console.error("Failed to load Events", eventsErr);

  books = booksData || [];
  events = eventsData || [];

  populateItemSelect();
}

async function loadPlatforms() {
  const { data, error } = await supabase.from("Social Media Accounts").select("*").limit(1);
  if (error) {
    console.error("Failed to load Social Media Accounts", error);
    return;
  }
  const account = data && data[0];
  const available = PLATFORM_LINK_FIELDS.filter((p) => account && account[p.field]);
  const platforms = available.length ? available : PLATFORM_LINK_FIELDS;

  platformLinks = {};
  for (const p of platforms) {
    if (account && account[p.field]) platformLinks[p.label] = account[p.field];
  }

  platformPills.innerHTML = "";
  platforms.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (i === 0 ? " selected" : "");
    btn.dataset.value = p.label;
    btn.textContent = p.label;
    platformPills.appendChild(btn);
  });

  updateComposerPlatform();
}

// --- item picking --------------------------------------------------------

function itemLabel(type, item) {
  return type === "Book" ? `${item.title} — ${item.author}` : item.event_name;
}

function itemId(type, item) {
  return type === "Book" ? item.book_id : item.event_id;
}

function clearItemSelection() {
  selectedItem = null;
  detailsBox.textContent = "";
  resetComposer();
}

function populateItemSelect() {
  const type = selectedPillValue(typePills);
  itemSearchInput.placeholder = type === "Book" ? "Search books..." : "Search events...";
  itemSearchInput.value = "";
  closeItemList();
  clearItemSelection();
}

function renderItemList(query) {
  const type = selectedPillValue(typePills);
  const list = type === "Book" ? books : events;
  const q = query.trim().toLowerCase();

  itemListOptions = q ? list.filter((item) => itemLabel(type, item).toLowerCase().includes(q)) : list;
  itemListActiveIndex = -1;

  if (itemListOptions.length === 0) {
    itemList.innerHTML = '<li class="combobox-empty">No matches</li>';
  } else {
    itemList.innerHTML = itemListOptions
      .map(
        (item, i) =>
          `<li class="combobox-option" role="option" id="item-option-${i}" data-index="${i}">${itemLabel(type, item)}</li>`
      )
      .join("");
  }

  openItemList();
}

function openItemList() {
  itemList.classList.remove("hidden");
  itemSearchInput.setAttribute("aria-expanded", "true");
}

function closeItemList() {
  itemList.classList.add("hidden");
  itemSearchInput.setAttribute("aria-expanded", "false");
  itemListActiveIndex = -1;
}

function setActiveOption(index) {
  const options = itemList.querySelectorAll(".combobox-option");
  options.forEach((el) => el.classList.remove("active"));
  if (index >= 0 && options[index]) {
    options[index].classList.add("active");
    options[index].scrollIntoView({ block: "nearest" });
    itemSearchInput.setAttribute("aria-activedescendant", options[index].id);
  } else {
    itemSearchInput.removeAttribute("aria-activedescendant");
  }
  itemListActiveIndex = index;
}

function chooseItem(item) {
  const type = selectedPillValue(typePills);
  selectedItem = item;
  itemSearchInput.value = itemLabel(type, item);
  closeItemList();

  detailsBox.textContent =
    type === "Book"
      ? `${selectedItem.title} by ${selectedItem.author}\n\n${selectedItem.blurb}`
      : `${selectedItem.event_name} — ${formatDate(selectedItem.event_date)}\n\n${selectedItem.event_description}`;

  enableComposer();
}

// --- composer --------------------------------------------------------

function syncCaptionPreview() {
  composerCaption.textContent = captionInput.value;
}

function resetComposer() {
  composer.classList.add("composer-disabled");
  aiGenerateBtn.disabled = true;
  scheduleBtn.disabled = true;
  toneField.classList.add("hidden");
  captionInput.value = "";
  syncCaptionPreview();
  composerHashtags.textContent = "";
  imageIdeaLine.textContent = "";
  clearUpload();
  renderComposerMedia();
}

function enableComposer() {
  composer.classList.remove("composer-disabled");
  aiGenerateBtn.disabled = false;
  scheduleBtn.disabled = false;
  captionInput.value = "";
  syncCaptionPreview();
  composerHashtags.textContent = "";
  imageIdeaLine.textContent = "";
  clearUpload();
  renderComposerMedia();
}

function updateComposerPlatform() {
  const platform = selectedPillValue(platformPills) || "Instagram";
  composerPlatformLabel.textContent = platform;
}

const PLACEHOLDER_ASSETS = {
  Photo: "assets/placeholder-photo.png",
  Video: "assets/placeholder-video.webm",
};

const MAX_VIDEO_SECONDS = 8;

function clearUpload() {
  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = null;
  uploadInput.value = "";
  clearUploadBtn.classList.add("hidden");
  uploadError.textContent = "";
}

// Longer uploads aren't trimmed on disk — just looped to their first MAX_VIDEO_SECONDS in the preview.
function clampVideoTo8Seconds(video) {
  if (!video) return;
  video.addEventListener("timeupdate", () => {
    if (video.currentTime > MAX_VIDEO_SECONDS) {
      video.currentTime = 0;
    }
  });
}

function updateUploadField() {
  const asset = selectedPillValue(assetPills) || "Text";
  if (asset === "Text") {
    uploadField.classList.add("hidden");
    return;
  }
  uploadField.classList.remove("hidden");
  uploadInput.accept = asset === "Photo" ? "image/*" : "video/*";
  uploadLabelText.textContent = uploadedMediaUrl ? `Change ${asset.toLowerCase()}` : `Upload ${asset.toLowerCase()}`;
  clearUploadBtn.classList.toggle("hidden", !uploadedMediaUrl);
}

function renderComposerMedia() {
  const asset = selectedPillValue(assetPills) || "Text";
  updateUploadField();

  if (asset === "Text" || !selectedItem) {
    composerMedia.classList.add("hidden");
    composerMedia.innerHTML = "";
    composerMedia.style.background = "";
    return;
  }

  composerMedia.classList.remove("hidden");
  composerMedia.style.background = "";

  const type = selectedPillValue(typePills);
  const label = type === "Book" ? selectedItem.title : selectedItem.event_name;

  if (uploadedMediaUrl) {
    if (asset === "Photo") {
      composerMedia.innerHTML = `<img src="${uploadedMediaUrl}" alt="" class="composer-media-file" />`;
    } else {
      composerMedia.innerHTML = `<video src="${uploadedMediaUrl}" class="composer-media-file" controls muted autoplay loop playsinline></video>`;
      clampVideoTo8Seconds(composerMedia.querySelector("video"));
    }
    return;
  }

  // No upload yet — show a bundled sample asset so the mock post still looks like a real post.
  const placeholderTag =
    asset === "Photo"
      ? `<img src="${PLACEHOLDER_ASSETS.Photo}" alt="" class="composer-media-file" />`
      : `<video src="${PLACEHOLDER_ASSETS.Video}" class="composer-media-file" muted autoplay loop playsinline></video>`;
  composerMedia.innerHTML = `${placeholderTag}<span class="composer-media-overlay-label">${label}</span>`;
}

function generateWithTone(tone) {
  if (!selectedItem) return;
  const type = selectedPillValue(typePills);
  const template = pickRandom(CAPTION_TEMPLATES[type][tone]);
  const caption = template(selectedItem);
  const hashtags = hashtagsFor(type, selectedItem);
  const imageIdea = imageIdeaFor(type, tone);

  captionInput.value = caption;
  syncCaptionPreview();
  composerHashtags.textContent = hashtags.join(" ");
  imageIdeaLine.textContent = `Visual idea: ${imageIdea}`;
}

// --- scheduling / history --------------------------------------------------------

function generatePostId() {
  return `POST-${crypto.randomUUID()}`;
}

async function schedulePost() {
  if (!selectedItem) return;
  const type = selectedPillValue(typePills);
  const caption = captionInput.value.trim();
  if (!caption) {
    saveStatus.textContent = "Write or generate a caption first.";
    return;
  }

  const hashtags = composerHashtags.textContent.trim();
  const captionWithTags = hashtags ? `${caption}\n\n${hashtags}` : caption;
  const platform = selectedPillValue(platformPills) || "Instagram";
  const publishMode = selectedPillValue(publishModePills) || "now";
  const postDate = publishMode === "now" ? todayStr() : postDateInput.value || todayStr();

  scheduleBtn.disabled = true;
  saveStatus.textContent = publishMode === "now" ? "Posting..." : "Scheduling...";

  const row = {
    post_id: generatePostId(),
    post_date: postDate,
    platform,
    related_type: type,
    book_id: type === "Book" ? selectedItem.book_id : null,
    event_id: type === "Event" ? selectedItem.event_id : null,
    caption_text: captionWithTags,
  };

  const { error } = await supabase.from("Social Posts").insert(row);

  if (error) {
    console.error("Failed to save post", error);
    saveStatus.textContent = `Error ${publishMode === "now" ? "posting" : "scheduling"} post: ${error.message}`;
  } else {
    saveStatus.textContent = publishMode === "now" ? "Posted!" : "Scheduled!";
    captionInput.value = "";
    syncCaptionPreview();
    composerHashtags.textContent = "";
    imageIdeaLine.textContent = "";
    await loadHistory();
  }

  scheduleBtn.disabled = false;
}

function itemLabelFor(post) {
  if (post.related_type === "Book") {
    const book = books.find((b) => b.book_id === post.book_id);
    return book ? book.title : post.book_id || "";
  }
  const event = events.find((e) => e.event_id === post.event_id);
  return event ? event.event_name : post.event_id || "";
}

function buildRow(post, cells) {
  const tr = document.createElement("tr");
  tr.innerHTML = cells.join("");
  return tr;
}

async function loadHistory() {
  const { data, error } = await supabase
    .from("Social Posts")
    .select("post_id, post_date, platform, related_type, book_id, event_id, caption_text")
    .order("post_date", { ascending: false })
    .order("post_id", { ascending: false });

  if (error) {
    console.error("Failed to load Social Posts", error);
    upcomingBody.innerHTML = `<tr class="empty-row"><td colspan="4">Error loading history: ${error.message}</td></tr>`;
    publishedBody.innerHTML = "";
    return;
  }

  const today = todayStr();
  const upcomingAll = data.filter((p) => p.post_date >= today).sort((a, b) => a.post_date.localeCompare(b.post_date));
  const upcoming = upcomingAll.slice(0, 5);
  const published = data.filter((p) => p.post_date < today).sort((a, b) => b.post_date.localeCompare(a.post_date));

  upcomingCount.textContent = `(${upcomingAll.length})`;
  publishedCount.textContent = `(${published.length})`;

  upcomingBody.innerHTML = "";
  if (upcoming.length === 0) {
    upcomingBody.innerHTML = '<tr class="empty-row"><td colspan="4">Nothing scheduled yet.</td></tr>';
  } else {
    for (const post of upcoming) {
      upcomingBody.appendChild(
        buildRow(post, [
          `<td>${formatDate(post.post_date)}</td>`,
          `<td><span class="platform-badge">${post.platform}</span></td>`,
          `<td>${itemLabelFor(post)}</td>`,
          `<td class="caption-cell">${post.caption_text}</td>`,
        ])
      );
    }
  }

  publishedBody.innerHTML = "";
  if (published.length === 0) {
    publishedBody.innerHTML = '<tr class="empty-row"><td colspan="5">Nothing published yet.</td></tr>';
  } else {
    for (const post of published) {
      const link = platformLinks[post.platform];
      const linkCell = link
        ? `<td><a class="link-chip" href="${link}" target="_blank" rel="noopener" title="View on ${post.platform}" aria-label="View on ${post.platform}">&#8599;</a></td>`
        : `<td>&mdash;</td>`;
      publishedBody.appendChild(
        buildRow(post, [
          `<td>${formatDate(post.post_date)}</td>`,
          `<td><span class="platform-badge">${post.platform}</span></td>`,
          `<td>${itemLabelFor(post)}</td>`,
          `<td class="caption-cell">${post.caption_text}</td>`,
          linkCell,
        ])
      );
    }
  }
}

// --- wiring --------------------------------------------------------

setupPillGroup(typePills, populateItemSelect);

itemSearchInput.addEventListener("input", () => {
  if (selectedItem) clearItemSelection();
  renderItemList(itemSearchInput.value);
});

itemSearchInput.addEventListener("focus", () => {
  renderItemList(itemSearchInput.value);
});

itemSearchInput.addEventListener("keydown", (e) => {
  if (itemList.classList.contains("hidden") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    renderItemList(itemSearchInput.value);
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveOption(Math.min(itemListActiveIndex + 1, itemListOptions.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveOption(Math.max(itemListActiveIndex - 1, 0));
  } else if (e.key === "Enter") {
    if (itemListActiveIndex >= 0 && itemListOptions[itemListActiveIndex]) {
      e.preventDefault();
      chooseItem(itemListOptions[itemListActiveIndex]);
    }
  } else if (e.key === "Escape") {
    closeItemList();
  }
});

itemList.addEventListener("mousedown", (e) => {
  // mousedown (not click) fires before the input's blur, so the list is still in the DOM when we read it.
  const option = e.target.closest(".combobox-option");
  if (!option) return;
  e.preventDefault();
  chooseItem(itemListOptions[Number(option.dataset.index)]);
});

itemSearchInput.addEventListener("blur", () => {
  closeItemList();
  if (!selectedItem) itemSearchInput.value = "";
});

setupPillGroup(platformPills, updateComposerPlatform);
setupPillGroup(assetPills, () => {
  clearUpload();
  renderComposerMedia();
});
setupPillGroup(tonePills, (tone) => generateWithTone(tone));

captionInput.addEventListener("input", syncCaptionPreview);

aiGenerateBtn.addEventListener("click", () => {
  toneField.classList.toggle("hidden");
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  uploadError.textContent = "";

  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = URL.createObjectURL(file);
  renderComposerMedia();
});

clearUploadBtn.addEventListener("click", () => {
  clearUpload();
  renderComposerMedia();
});

setupPillGroup(publishModePills, (mode) => {
  scheduleDateRow.classList.toggle("hidden", mode !== "schedule");
  scheduleBtn.textContent = mode === "schedule" ? "Schedule post" : "Post now";
});

scheduleBtn.addEventListener("click", schedulePost);
refreshHistoryBtn.addEventListener("click", loadHistory);

setupPillGroup(historyTabs, (tab) => {
  upcomingPanel.classList.toggle("hidden", tab !== "upcoming");
  publishedPanel.classList.toggle("hidden", tab !== "published");
});

postDateInput.value = todayStr();
postDateInput.min = todayStr();

async function init() {
  // loadHistory needs books/events loaded first to resolve item titles for the table.
  await Promise.all([loadPickerData(), loadPlatforms()]);
  await loadHistory();
}
init();
