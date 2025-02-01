// Default quotes if no data exists in localStorage
const defaultQuotes = [
  {
    text: "The only limit to our realization of tomorrow is our doubts of today.",
    category: "Motivation",
  },
  {
    text: "Life is 10% what happens to us and 90% how we react to it.",
    category: "Life",
  },
  {
    text: "Do what you can, with what you have, where you are.",
    category: "Inspiration",
  },
];

// Load quotes from local storage or use default ones
let quotes = JSON.parse(localStorage.getItem("quotes")) || defaultQuotes;

// Server URL (Simulated API for syncing)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Function to update sync status dynamically
function updateSyncMessage(message, status = "info") {
  const syncStatus = document.getElementById("syncStatus");
  syncStatus.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  syncStatus.style.color = status === "error" ? "red" : "green";

  // Auto-clear message after 5 seconds
  setTimeout(() => {
    syncStatus.textContent = "";
  }, 5000);
}

// Function to display a random quote
function showRandomQuote() {
  if (quotes.length === 0) return;

  const quoteDisplay = document.getElementById("quoteDisplay");
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  quoteDisplay.textContent = `${randomQuote.text} - [${randomQuote.category}]`;

  // Store last displayed quote in session storage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}

// Function to add a new quote
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document
    .getElementById("newQuoteCategory")
    .value.trim();

  if (newQuoteText && newQuoteCategory) {
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote);

    // Save updated quotes in local storage
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Sync with server
    syncQuotes(newQuote);

    // Clear input fields
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("Quote added successfully!");
    populateCategories();
    filterQuotes();
  } else {
    alert("Please enter both a quote and a category.");
  }
}

// Function to populate categories dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`; // Reset

  const categories = [...new Set(quotes.map((q) => q.category))]; // Get unique categories
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore the last selected category from localStorage
  const lastCategory = localStorage.getItem("selectedCategory");
  if (lastCategory) {
    categoryFilter.value = lastCategory;
  }
}

// Function to display quotes based on the selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = "";

  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  filteredQuotes.forEach((quote) => {
    const quoteElement = document.createElement("p");
    quoteElement.textContent = `${quote.text} - [${quote.category}]`;
    quoteDisplay.appendChild(quoteElement);
  });
}

// Function to export quotes to a JSON file
function exportToJsonFile() {
  const jsonData = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Function to import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        localStorage.setItem("quotes", JSON.stringify(quotes));
        alert("Quotes imported successfully!");
        populateCategories();
        filterQuotes();
      } else {
        alert("Invalid JSON format.");
      }
    } catch (error) {
      alert("Error reading JSON file.");
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// Function to sync a new quote with the server
async function syncQuotes(newQuote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify(newQuote),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      updateSyncMessage("Quote synced successfully!");
    } else {
      updateSyncMessage("Server sync failed!", "error");
    }
  } catch (error) {
    updateSyncMessage("Error syncing to server!", "error");
  }
}

// Function to fetch and sync quotes from the server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverQuotes = await response.json();

    if (serverQuotes.length > 0) {
      const newQuotes = serverQuotes.map((q) => ({
        text: q.title,
        category: "General",
      }));

      // Merge server quotes with local quotes
      const mergedQuotes = mergeQuotes(newQuotes, quotes);
      localStorage.setItem("quotes", JSON.stringify(mergedQuotes));

      // Update UI
      quotes = mergedQuotes;
      populateCategories();
      filterQuotes();

      updateSyncMessage("Quotes synced with server!");
    }
  } catch (error) {
    updateSyncMessage("Error fetching quotes from server!", "error");
  }
}

// Function to merge quotes and resolve conflicts
function mergeQuotes(serverQuotes, localQuotes) {
  const localTextSet = new Set(localQuotes.map((q) => q.text));

  serverQuotes.forEach((quote) => {
    if (!localTextSet.has(quote.text)) {
      localQuotes.push(quote);
    }
  });

  return localQuotes;
}

// Auto-sync every 30 seconds
setInterval(fetchQuotesFromServer, 30000);

// Attach event listener to show a new quote
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Load the last viewed quote from session storage on page load
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  fetchQuotesFromServer();

  const lastViewedQuote = JSON.parse(sessionStorage.getItem("lastViewedQuote"));
  if (lastViewedQuote) {
    document.getElementById(
      "quoteDisplay"
    ).textContent = `${lastViewedQuote.text} - [${lastViewedQuote.category}]`;
  } else {
    showRandomQuote();
  }
});

// Add input fields dynamically
function createAddQuoteForm() {
  document.addEventListener("DOMContentLoaded", () => {
    const inputContainer = document.createElement("div");
    inputContainer.innerHTML = `
     <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
     <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
     <button onclick="addQuote()">Add Quote</button>
 `;
    document.body.appendChild(inputContainer);

    displayQuotes();
  });
}
createAddQuoteForm();
