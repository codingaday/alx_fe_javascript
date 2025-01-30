// Load quotes from localStorage or initialize with default quotes
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  {
    text: "Be the change you wish to see in the world.",
    category: "inspirational",
  },
  {
    text: "The only way to do great work is to love what you do.",
    category: "success",
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    category: "business",
  },
];

// DOM Elements
const categoryFilter = document.getElementById("categoryFilter");
const quoteDisplay = document.getElementById("quoteDisplay");

// Save to localStorage helper
// Saving
const saveQuotes = () => {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  localStorage.setItem("selectedCategory", categoryFilter.value);
};

// Populate category filter dropdown
const populateCategories = () => {
  const categories = ["all", ...new Set(quotes.map((quote) => quote.category))];
  const storedCategory = localStorage.getItem("selectedCategory") || "all";

  // Clear existing options
  categoryFilter.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category; // ← textContent used here
    option.selected = category === storedCategory;
    categoryFilter.appendChild(option);
  });
};

// Filter and display quotes based on selected category
const filterQuotes = () => {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  quoteDisplay.innerHTML = filteredQuotes
    .map(
      (quote) => `
     <div class="quote-item">
         <blockquote>"${quote.text}"</blockquote>
         <em>- ${quote.category}</em>
     </div>
 `
    )
    .join("");

  saveQuotes();
};

// Show random quote from filtered quotes
const showRandomQuote = () => {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found in this category</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
     <div class="quote-item">
         <blockquote>"${randomQuote.text}"</blockquote>
         <em>- ${randomQuote.category}</em>
     </div>
 `;
};

// Add quote form and functionality
const createAddQuoteForm = () => {
  const form = document.createElement("div");
  form.innerHTML = `
     <div style="margin-top: 20px;">
         <input id="newQuoteText" type="text" placeholder="Enter new quote">
         <input id="newQuoteCategory" type="text" placeholder="Enter category">
         <button onclick="addQuote()">Add Quote</button>
     </div>
 `;
  document.body.appendChild(form);
};

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  filterQuotes(); // Restores last filter
});

// Event listeners
categoryFilter.addEventListener("change", filterQuotes);
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
//////////////////////////////////////////////

// Server simulation constants
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 30000; // 30 seconds

// Enhanced quote structure

let pendingChanges = [];

// Server simulation layer
const ServerSimulator = {
  async getServerQuotes() {
    try {
      const response = await fetch(API_URL);
      const serverData = await response.json();
      return serverData.map((post) => ({
        id: `server-${post.id}`,
        text: post.title,
        category: "server",
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error("Server unavailable, using local data");
      return [];
    }
  },

  async postQuote(quote) {
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(quote),
        headers: { "Content-type": "application/json; charset=UTF-8" },
      });
    } catch (error) {
      pendingChanges.push(quote);
    }
  },
};

// Enhanced sync logic
const syncWithServer = async () => {
  const serverQuotes = await ServerSimulator.getServerQuotes();
  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

  // Conflict resolution
  const serverIds = new Set(serverQuotes.map((q) => q.id));
  const mergedQuotes = [
    ...localQuotes.filter((q) => !serverIds.has(q.id)),
    ...serverQuotes,
  ];

  // Merge pending changes
  if (pendingChanges.length > 0) {
    mergedQuotes.push(...pendingChanges);
    pendingChanges = [];
  }

  localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
  quotes = mergedQuotes;
  updateUI();
  showNotification("Data synced with server");
};

// Enhanced quote management
const addQuote = (text, category) => {
  const newQuote = {
    id: `local-${Date.now()}`,
    text: text.trim(),
    category: category.trim(),
    timestamp: Date.now(),
  };

  quotes.push(newQuote);
  ServerSimulator.postQuote(newQuote);
  saveToLocal();
  updateUI();
};

// Conflict UI management
const showConflictResolution = (conflicts) => {
  const resolutionDiv = document.getElementById("conflictResolution");
  resolutionDiv.innerHTML = conflicts
    .map(
      (conflict) => `
    <div class="conflict-item">
      <p>Server: ${conflict.server.text}</p>
      <p>Local: ${conflict.local.text}</p>
      <button onclick="resolveConflict('${conflict.server.id}', 'keep-server')">
        Keep Server Version
      </button>
      <button onclick="resolveConflict('${conflict.local.id}', 'keep-local')">
        Keep Local Version
      </button>
    </div>
  `
    )
    .join("");
};

// Sync helpers
const manualSync = () => {
  syncWithServer();
  showNotification("Manual sync initiated...");
};

const showNotification = (message) => {
  const statusDiv = document.getElementById("syncStatus");
  statusDiv.textContent = message;
  setTimeout(() => (statusDiv.textContent = ""), 3000);
};

// Initialize periodic sync
document.addEventListener("DOMContentLoaded", () => {});
