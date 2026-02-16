async function fetchArticles() {
  const res = await fetch("https://v2.jokeapi.dev/joke/Any?lang=fr&amount=10");
  if (!res.ok) throw new Error("HTTP error " + res.status);
  const data = await res.json();
  return data.jokes; // array
}


function createCard(article) {
    const card = document.createElement("div");
    card.classList.add("card");

    const title = document.createElement("h3");
    title.textContent = article.setup;

    const content = document.createElement("p");
    content.textContent = article.delivery;

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


(async () => {
  try {
    const data = await fetchArticles();
    displayFeed(data);
  } catch (err) {
    console.error(err);
  }
})();


let allItems = [];

const statusEl = document.getElementById("status");

function setStatus(msg) {
  statusEl.textContent = msg;
}

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
