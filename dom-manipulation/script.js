// Load quotes from local storage or use default quotes
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  {
    text: "Be the change you wish to see in the world.",
    category: "Inspirational",
  },
  {
    text: "The only way to do great work is to love what you do.",
    category: "Motivational",
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    category: "Life",
  },
];

let lastSyncTime = localStorage.getItem("lastSyncTime") || 0;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  populateCategories();
  showRandomQuote();
  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);

  // Simulate periodic syncing with server
  setInterval(fetchServerQuotes, 60000); // Sync every minute
  fetchServerQuotes(); // Initial fetch
});

// Populate filter dropdown with categories
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.innerHTML = `<option value="All">All Categories</option> ${getCategoryOptions()}`;
  categoryFilter.value = localStorage.getItem("selectedCategory") || "All";
}

// Get category options for dropdowns
function getCategoryOptions() {
  let categories = [...new Set(quotes.map((q) => q.category))];
  return categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}

// Show random quote
function showRandomQuote() {
  const displayDiv = document.getElementById("quoteDisplay");
  const category = document.getElementById("categoryFilter")?.value || "All";
  let filteredQuotes =
    category === "All" ? quotes : quotes.filter((q) => q.category === category);

  if (filteredQuotes.length === 0) {
    displayDiv.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  displayDiv.textContent = `${filteredQuotes[randomIndex].text} (${filteredQuotes[randomIndex].category})`;

  sessionStorage.setItem("lastViewedQuote", displayDiv.textContent);
}

// Filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  const displayDiv = document.getElementById("quoteDisplay");

  let filteredQuotes =
    selectedCategory === "All"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    displayDiv.innerHTML = "No quotes available in this category.";
  } else {
    displayDiv.innerHTML = filteredQuotes
      .map((q) => `<p>${q.text} (${q.category})</p>`)
      .join("");
  }
}

// Add new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText").value.trim();
  const categoryInput = document
    .getElementById("newQuoteCategory")
    .value.trim();

  if (!textInput || !categoryInput) {
    alert("Please fill in both fields.");
    return;
  }

  quotes.push({ text: textInput, category: categoryInput });
  localStorage.setItem("quotes", JSON.stringify(quotes));

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  showRandomQuote();
}

// Export quotes as JSON file
function exportToJson() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(quotes, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "quotes.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

// Import quotes from JSON file
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
        showRandomQuote();
      } else {
        alert("Invalid file format.");
      }
    } catch (e) {
      alert("Error parsing JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Simulate server fetch
function fetchServerQuotes() {
  const serverUrl = "https://jsonplaceholder.typicode.com/posts"; // Mock API URL
  fetch(serverUrl)
    .then((response) => response.json())
    .then((data) => {
      const newQuotes = data.map((post) => ({
        text: post.title,
        category: "Imported", // Default category
      }));

      if (newQuotes.length > 0) {
        resolveConflicts(newQuotes);
      }
    })
    .catch((error) => console.error("Error fetching from server:", error));
}

// Resolve conflicts between local and server data
function resolveConflicts(newQuotes) {
  const currentQuotes = [...quotes];
  const mergedQuotes = [...newQuotes];

  newQuotes.forEach((newQuote) => {
    const existingQuoteIndex = currentQuotes.findIndex(
      (quote) =>
        quote.text === newQuote.text && quote.category === newQuote.category
    );
    if (existingQuoteIndex === -1) {
      currentQuotes.push(newQuote);
    } else {
      // If conflict detected, prefer server data
      currentQuotes[existingQuoteIndex] = newQuote;
    }
  });

  quotes = currentQuotes;
  localStorage.setItem("quotes", JSON.stringify(quotes));
  lastSyncTime = Date.now();
  localStorage.setItem("lastSyncTime", lastSyncTime);

  alert("Quotes synchronized with server!");
  populateCategories();
  showRandomQuote();
}
