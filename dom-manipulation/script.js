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

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  filterQuotes();
  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);
});

// Populate category dropdown
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

// Filter quotes based on selected category
const filterQuotes = () => {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  updateQuoteDisplay(filteredQuotes);
};

// Update displayed quotes
const updateQuoteDisplay = (filteredQuotes) => {
  quoteDisplay.innerHTML =
    filteredQuotes.length > 0
      ? filteredQuotes
          .map(
            (quote) => `
         <div class="quote-item">
             <blockquote>"${quote.text}"</blockquote>
             <em>- ${quote.category}</em>
         </div>
     `
          )
          .join("")
      : `<p>No quotes found in this category</p>`;
};

// Show random quote from filtered list
const showRandomQuote = () => {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  if (filteredQuotes.length === 0) return;

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
     <div class="quote-item">
         <blockquote>"${randomQuote.text}"</blockquote>
         <em>- ${randomQuote.category}</em>
     </div>
 `;
};

// Add new quote
const addQuote = () => {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    localStorage.setItem("quotes", JSON.stringify(quotes));
    populateCategories();
    filterQuotes();
    textInput.value = "";
    categoryInput.value = "";
  }
};

// Event listeners
categoryFilter.addEventListener("change", filterQuotes);
