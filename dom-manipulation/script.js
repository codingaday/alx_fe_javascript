let quotes = [
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

function showRandomQuote() {
  const categorySelect = document.getElementById("categorySelect");
  const selectedCategory = categorySelect.value;
  const quoteDisplay = document.getElementById("quoteDisplay");

  let filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.innerHTML = `
     <blockquote>"${randomQuote.text}"</blockquote>
     <em>- ${randomQuote.category}</em>
 `;
}

function createAddQuoteForm() {
  const formDiv = document.createElement("div");
  formDiv.className = "form-section";
  formDiv.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button onclick="addQuote()">Add Quote</button>
  `;
  document.body.appendChild(formDiv);
}

function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    updateCategoryDropdown();
    textInput.value = "";
    categoryInput.value = "";
    showRandomQuote();
  }
}

function updateCategoryDropdown() {
  const categorySelect = document.getElementById("categorySelect");
  const currentValue = categorySelect.value;

  // Preserve 'all' option and add unique categories
  const categories = ["all", ...new Set(quotes.map((quote) => quote.category))];
  categorySelect.innerHTML = categories
    .map(
      (category) =>
        `<option value="${category}" ${
          category === currentValue ? "selected" : ""
        }>${category}</option>`
    )
    .join("");
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  updateCategoryDropdown();
  createAddQuoteForm();
  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);
  showRandomQuote();
});
