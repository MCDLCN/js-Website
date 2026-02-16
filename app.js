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
