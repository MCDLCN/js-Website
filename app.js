async function fetchArticles() {
  const res = await fetch("https://v2.jokeapi.dev/joke/Any?lang=fr&amount=10");
  if (!res.ok) throw new Error("HTTP error " + res.status);
  const data = await res.json();
  return data.jokes; // array
}


function createCard(item) {
  const card = document.createElement("div");
  card.classList.add("card");

  const title = document.createElement("h3");
  title.textContent = item.title ?? item.setup ?? "Untitled";

  const content = document.createElement("p");
  content.textContent = item.body ?? item.delivery ?? item.joke ?? "";

  card.appendChild(title);
  card.appendChild(content);

  return card;
}


function displayFeed(data) {
    const container = document.getElementById("feed-container");

    container.innerHTML = "";

    data.forEach(article => {
        const card = createCard(article);
        container.appendChild(card);
    });
}


const statusEl = document.getElementById("status");

function setStatus(msg) {
  statusEl.textContent = msg;
}

let allItems = [];

async function loadFeed() {
  try {
    setStatus("Loading...");
    allItems = await fetchArticles();
    displayFeed(allItems);
    setStatus(`Loaded ${allItems.length} items.`);
  } catch (err) {
    console.error(err);
    setStatus("Error loading the feed. Check the console.");
  }
}


function normalize(str) {
  return (str ?? "").toString().toLowerCase();
}

document.getElementById("search").addEventListener("input", (e) => {
  const q = normalize(e.target.value);
  const filtered = allItems.filter(item =>
    normalize(item.title ?? item.titre ?? item.joke ?? item.setup).includes(q) ||
    normalize(item.body ?? item.contenu ?? item.delivery).includes(q)
  );
  displayFeed(filtered);
});

document.getElementById("refresh").addEventListener("click", loadFeed);

// initial load
loadFeed();

function nextId() {
  const ids = allItems.map(x => Number(x.id)).filter(Number.isFinite);
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

document.getElementById("post-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const titleEl = document.getElementById("post-title");
  const contentEl = document.getElementById("post-content");

  const newPost = {
    id: nextId(),
    title: titleEl.value.trim(),
    body: contentEl.value.trim(),
  };

  // Add at the top of the feed
  allItems.unshift(newPost);

  // Re-render
  displayFeed(allItems);

  // Reset form
  e.target.reset();
});


const images = [
  { id: 1, title: "Mountain", url: "https://picsum.photos/id/1018/800/600" },
  { id: 2, title: "Forest",   url: "https://picsum.photos/id/1020/800/600" },
  { id: 3, title: "Sea",      url: "https://picsum.photos/id/1011/800/600" },
  { id: 4, title: "Road",     url: "https://picsum.photos/id/1033/800/600" },
  { id: 5, title: "City",     url: "https://picsum.photos/id/1015/800/600" },
  { id: 6, title: "Sky",      url: "https://picsum.photos/id/1003/800/600" },
];

const galleryEl = document.getElementById("gallery");
const previewImg = document.getElementById("preview-img");
const previewTitle = document.getElementById("preview-title");

function setPreview(item) {
  previewImg.src = item.url;
  previewImg.alt = item.title;
  previewTitle.textContent = item.title;
}

function renderGallery(data) {
  galleryEl.innerHTML = "";

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "thumb";

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.title;

    card.appendChild(img);

    card.addEventListener("click", () => setPreview(item));

    galleryEl.appendChild(card);
  });

  // default preview (first image)
  if (data.length) setPreview(data[0]);
}

// view toggle
document.getElementById("view-grid").addEventListener("click", () => {
  galleryEl.classList.add("gallery--grid");
  galleryEl.classList.remove("gallery--list");
});

document.getElementById("view-list").addEventListener("click", () => {
  galleryEl.classList.add("gallery--list");
  galleryEl.classList.remove("gallery--grid");
});

renderGallery(images);
