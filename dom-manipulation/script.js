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
const quoteContainer = document.getElementById("quoteContainer");

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

  categoryFilter.innerHTML = categories
    .map(
      (category) =>
        `<option value="${category}" ${
          category === storedCategory ? "selected" : ""
        }>
         ${category}
     </option>`
    )
    .join("");
};

// Filter and display quotes based on selected category
const filterQuotes = () => {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  quoteContainer.innerHTML = ""; // Clear container

  if (filteredQuotes.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No quotes found in this category";
    quoteContainer.appendChild(message);
    return;
  }

  filteredQuotes.forEach((quote) => {
    const container = document.createElement("div");
    container.className = "quote-item";

    const blockquote = document.createElement("blockquote");
    blockquote.textContent = `"${quote.text}"`;

    const category = document.createElement("em");
    category.textContent = `- ${quote.category}`;

    container.append(blockquote, category);
    quoteContainer.appendChild(container);
  });

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
    quoteContainer.innerHTML = `<p>No quotes found in this category</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteContainer.innerHTML = `
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

const addQuote = () => {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    filterQuotes();
    textInput.value = "";
    categoryInput.value = "";
  }
};

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  filterQuotes(); // Restores last filter
});

// Event listeners
categoryFilter.addEventListener("change", filterQuotes);
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
