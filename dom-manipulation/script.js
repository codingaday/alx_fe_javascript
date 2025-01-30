// Quote Generator with Server Sync and Conflict Resolution
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 30000; // 30 seconds

// State Management
let quotes = JSON.parse(localStorage.getItem("quotes")) || [];
let pendingChanges = [];
let conflicts = [];

// DOM Elements
const categoryFilter = document.getElementById("categoryFilter");
const quoteContainer = document.getElementById("quoteContainer");
const syncStatus = document.getElementById("syncStatus");
const conflictResolution = document.getElementById("conflictResolution");

// Server Simulation Functions
const fetchQuotesFromServer = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return data.map((post) => ({
      id: `server-${post.id}`,
      text: post.title,
      category: "server",
      timestamp: Date.now(),
    }));
  } catch (error) {
    showNotification("Server unavailable - using local data", true);
    return [];
  }
};

const postQuoteToServer = async (quote) => {
  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(quote),
      headers: { "Content-type": "application/json; charset=UTF-8" },
    });
  } catch (error) {
    pendingChanges.push(quote);
    showNotification("Failed to post quote - queued for retry", true);
  }
};

// Data Sync Logic
const syncQuotes = async () => {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

    // Merge strategies
    const serverMap = new Map(serverQuotes.map((q) => [q.id, q]));
    const localMap = new Map(localQuotes.map((q) => [q.id, q]));

    // Detect conflicts
    const newConflicts = [];
    const mergedQuotes = [];

    // Merge server and local quotes
    serverMap.forEach((serverQuote, id) => {
      const localQuote = localMap.get(id);

      if (localQuote) {
        if (serverQuote.timestamp > localQuote.timestamp) {
          mergedQuotes.push(serverQuote);
          localMap.delete(id);
        } else {
          newConflicts.push({ server: serverQuote, local: localQuote });
        }
      } else {
        mergedQuotes.push(serverQuote);
      }
    });

    // Add remaining local quotes
    localMap.forEach((localQuote) => mergedQuotes.push(localQuote));

    // Add pending changes
    if (pendingChanges.length) {
      mergedQuotes.push(...pendingChanges);
      pendingChanges = [];
    }

    // Update state and storage
    quotes = mergedQuotes;
    localStorage.setItem("quotes", JSON.stringify(mergedQuotes));

    // Handle conflicts
    if (newConflicts.length) {
      conflicts = newConflicts;
      showConflictResolution(newConflicts);
    }

    updateUI();
    showNotification("Data synced successfully");
  } catch (error) {
    showNotification("Sync failed - retrying later", true);
  }
};

// Conflict Resolution
const showConflictResolution = (conflicts) => {
  conflictResolution.innerHTML = `
    <div class="conflict-header">
      <h3>Resolve Conflicts (${conflicts.length})</h3>
      <button onclick="closeConflictResolution()">×</button>
    </div>
    ${conflicts
      .map(
        (conflict, index) => `
      <div class="conflict-item">
        <p><strong>Server Version:</strong> ${conflict.server.text}</p>
        <p><strong>Local Version:</strong> ${conflict.local.text}</p>
        <div class="conflict-actions">
          <button onclick="resolveConflict(${index}, 'server')">
            Keep Server Version
          </button>
          <button onclick="resolveConflict(${index}, 'local')">
            Keep Local Version
          </button>
        </div>
      </div>
    `
      )
      .join("")}
  `;
  conflictResolution.style.display = "block";
};

const resolveConflict = (index, version) => {
  const conflict = conflicts[index];
  const resolvedQuote = version === "server" ? conflict.server : conflict.local;

  quotes = quotes.filter(
    (q) => q.id !== conflict.server.id && q.id !== conflict.local.id
  );
  quotes.push(resolvedQuote);

  localStorage.setItem("quotes", JSON.stringify(quotes));
  conflicts.splice(index, 1);

  if (!conflicts.length) closeConflictResolution();
  updateUI();
};

const closeConflictResolution = () => {
  conflictResolution.style.display = "none";
};

// Core Application Logic
const addQuote = (text, category) => {
  const newQuote = {
    id: `local-${Date.now()}`,
    text: text.trim(),
    category: category.trim(),
    timestamp: Date.now(),
  };

  quotes.push(newQuote);
  postQuoteToServer(newQuote);
  saveToLocal();
  updateUI();
};

const saveToLocal = () => {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  localStorage.setItem("selectedCategory", categoryFilter.value);
};

const updateUI = () => {
  populateCategories();
  filterQuotes();
};

const populateCategories = () => {
  const categories = ["all", ...new Set(quotes.map((q) => q.category))];
  const storedCategory = localStorage.getItem("selectedCategory") || "all";

  categoryFilter.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    option.selected = category === storedCategory;
    categoryFilter.appendChild(option);
  });
};

const filterQuotes = () => {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  quoteContainer.innerHTML = "";

  if (!filteredQuotes.length) {
    const message = document.createElement("p");
    message.textContent = "No quotes found in this category";
    quoteContainer.appendChild(message);
    return;
  }

  filteredQuotes.forEach((quote) => {
    const container = document.createElement("div");
    container.className = "quote-item";

    const text = document.createElement("blockquote");
    text.textContent = `"${quote.text}"`;

    const category = document.createElement("em");
    category.textContent = `- ${quote.category}`;

    container.append(text, category);
    quoteContainer.appendChild(container);
  });
};

// UI Helpers
const showNotification = (message, isError = false) => {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status ${isError ? "error" : "success"}`;
  setTimeout(() => (syncStatus.textContent = ""), 5000);
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initial setup
  populateCategories();
  filterQuotes();

  // Sync initialization
  syncQuotes();
  setInterval(syncQuotes, SYNC_INTERVAL);

  // Event listeners
  categoryFilter.addEventListener("change", filterQuotes);
  document.getElementById("newQuote").addEventListener("click", () => {
    const filtered = quotes.filter((q) => q.category === categoryFilter.value);
    const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
    if (randomQuote) filterQuotes([randomQuote]);
  });
});

// Public API
window.addQuote = addQuote;
window.resolveConflict = resolveConflict;
window.closeConflictResolution = closeConflictResolution;
window.manualSync = () => {
  showNotification("Manual sync initiated...");
  syncQuotes();
};
