import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const typeSelect = document.getElementById("type-select");
const itemSelect = document.getElementById("item-select");
const detailsBox = document.getElementById("item-details");
const generateBtn = document.getElementById("generate-btn");
const captionBox = document.getElementById("caption-text");
const platformSelect = document.getElementById("platform-select");
const saveBtn = document.getElementById("save-btn");
const saveStatus = document.getElementById("save-status");
const historyBody = document.getElementById("history-body");
const refreshHistoryBtn = document.getElementById("refresh-history-btn");

let books = [];
let events = [];
let selectedItem = null;

const PLATFORM_LINK_FIELDS = [
  { field: "instagram_link", label: "Instagram" },
  { field: "tiktok_link", label: "TikTok" },
  { field: "x_link", label: "X" },
  { field: "website_link", label: "Website" },
];

const CAPTION_TEMPLATES = {
  Book: [
    ({ title }) => `New arrival alert: ${title} just landed at Riverside Books.`,
    ({ title }) => `A quiet favorite: ${title}. Now in stock at Riverside Books.`,
    ({ title }) => `Staff pick of the week: ${title}. Come see why we can't stop recommending it.`,
    ({ title }) => `Curling up with ${title} this weekend. What are you reading?`,
    ({ title }) => `Some stories stay with you. Meet ${title}, on our shelves now.`,
  ],
  Event: [
    ({ event_name, event_date }) => `Mark your calendar for ${event_name} on ${event_date}. See you there!`,
    ({ event_name, event_date }) => `Tickets are moving for ${event_name} — don't miss it on ${event_date}.`,
  ],
};

function postIdeaFor(type) {
  return type === "Book"
    ? "Pair with a shelf photo or a short staff-pick video."
    : "Pair with an event flyer graphic or a countdown story.";
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function loadPickerData() {
  const [{ data: booksData, error: booksErr }, { data: eventsData, error: eventsErr }] =
    await Promise.all([
      supabase.from("Books").select("book_id, title, author, blurb").order("title"),
      supabase.from("Events").select("event_id, event_name, event_date, event_description").order("event_date"),
    ]);

  if (booksErr) console.error("Failed to load Books", booksErr);
  if (eventsErr) console.error("Failed to load Events", eventsErr);

  books = booksData || [];
  events = eventsData || [];

  populateItemSelect();
}

function populateItemSelect() {
  const type = typeSelect.value;
  const list = type === "Book" ? books : events;

  itemSelect.innerHTML = '<option value="">-- choose --</option>';
  for (const item of list) {
    const opt = document.createElement("option");
    opt.value = type === "Book" ? item.book_id : item.event_id;
    opt.textContent = type === "Book" ? `${item.title} — ${item.author}` : item.event_name;
    itemSelect.appendChild(opt);
  }

  selectedItem = null;
  detailsBox.textContent = "";
  captionBox.value = "";
  generateBtn.disabled = true;
  saveBtn.disabled = true;
}

function onItemChosen() {
  const type = typeSelect.value;
  const id = itemSelect.value;
  const list = type === "Book" ? books : events;
  selectedItem =
    list.find((i) => (type === "Book" ? i.book_id : i.event_id) === id) || null;

  if (!selectedItem) {
    detailsBox.textContent = "";
    generateBtn.disabled = true;
    return;
  }

  detailsBox.textContent =
    type === "Book"
      ? `${selectedItem.title} by ${selectedItem.author}\n\n${selectedItem.blurb}`
      : `${selectedItem.event_name} — ${selectedItem.event_date}\n\n${selectedItem.event_description}`;

  generateBtn.disabled = false;
  captionBox.value = "";
  saveBtn.disabled = true;
}

function generateCaption() {
  if (!selectedItem) return;
  const type = typeSelect.value;
  const template = pickRandom(CAPTION_TEMPLATES[type]);
  const caption = template(selectedItem);
  captionBox.value = `${caption}\n\nPost idea: ${postIdeaFor(type)}`;
  saveBtn.disabled = false;
}

async function loadPlatforms() {
  const { data, error } = await supabase.from("Social Media Accounts").select("*").limit(1);
  if (error) {
    console.error("Failed to load Social Media Accounts", error);
    return;
  }
  const account = data && data[0];
  platformSelect.innerHTML = "";
  const available = PLATFORM_LINK_FIELDS.filter((p) => account && account[p.field]);
  const platforms = available.length ? available : PLATFORM_LINK_FIELDS;
  for (const p of platforms) {
    const opt = document.createElement("option");
    opt.value = p.label;
    opt.textContent = p.label;
    platformSelect.appendChild(opt);
  }
}

function generatePostId() {
  return `POST-${crypto.randomUUID()}`;
}

async function savePost() {
  if (!selectedItem) return;
  const type = typeSelect.value;
  const caption = captionBox.value.trim();
  if (!caption) return;

  saveBtn.disabled = true;
  saveStatus.textContent = "Saving...";

  const row = {
    post_id: generatePostId(),
    post_date: new Date().toISOString().slice(0, 10),
    platform: platformSelect.value,
    related_type: type,
    book_id: type === "Book" ? selectedItem.book_id : null,
    event_id: type === "Event" ? selectedItem.event_id : null,
    caption_text: caption,
  };

  const { error } = await supabase.from("Social Posts").insert(row);

  if (error) {
    console.error("Failed to save post", error);
    saveStatus.textContent = `Error saving post: ${error.message}`;
  } else {
    saveStatus.textContent = "Saved!";
    await loadHistory();
  }

  saveBtn.disabled = false;
}

async function loadHistory() {
  const { data, error } = await supabase
    .from("Social Posts")
    .select("post_id, post_date, platform, related_type, book_id, event_id, caption_text")
    .order("post_date", { ascending: false })
    .order("post_id", { ascending: false });

  if (error) {
    console.error("Failed to load Social Posts", error);
    historyBody.innerHTML = `<tr><td colspan="6">Error loading history: ${error.message}</td></tr>`;
    return;
  }

  historyBody.innerHTML = "";
  for (const post of data) {
    const relatedId = post.book_id || post.event_id || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${post.post_date}</td>
      <td>${post.platform}</td>
      <td>${post.related_type}</td>
      <td>${relatedId}</td>
      <td>${post.caption_text}</td>
      <td>${post.post_id}</td>
    `;
    historyBody.appendChild(tr);
  }
}

typeSelect.addEventListener("change", populateItemSelect);
itemSelect.addEventListener("change", onItemChosen);
generateBtn.addEventListener("click", generateCaption);
saveBtn.addEventListener("click", savePost);
refreshHistoryBtn.addEventListener("click", loadHistory);

loadPickerData();
loadPlatforms();
loadHistory();
