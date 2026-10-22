// StockNest — JavaScript capstone. Data is stored in memory only.
const inventory = [
  { id: 1, name: "Laptop", price: 800, icon: "💻" },
  { id: 2, name: "Mouse", price: 25, icon: "🖱️" },
  { id: 3, name: "Monitor", price: 150, icon: "🖥️" }
];
let nextId = 4;
let editingId = null;

const $ = (selector) => document.querySelector(selector);
const money = (value) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const shortMoney = (value) => "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });

// if...else classifies price ranges.
function getCategory(price) {
  if (price < 50) return "Budget";
  else if (price < 200) return "Standard";
  else return "Premium";
}

// switch assigns the matching visual style.
function categoryClass(category) {
  switch (category) {
    case "Budget": return "budget";
    case "Standard": return "standard";
    case "Premium": return "premium";
    default: return "";
  }
}

// Arrow function + local scope for financial calculation.
const calculateInventoryValue = (products) => {
  let total = 0;
  products.forEach((product) => { total += product.price; });
  return total;
};

const calculateFinalTotal = (subtotal, taxPercent, discountPercent) => {
  const tax = subtotal * taxPercent / 100;
  const discount = subtotal * discountPercent / 100;
  return subtotal + tax - discount;
};

function iconFor(name) {
  const text = name.toLowerCase();
  if (text.includes("laptop") || text.includes("computer")) return "💻";
  if (text.includes("mouse")) return "🖱️";
  if (text.includes("monitor") || text.includes("screen")) return "🖥️";
  if (text.includes("keyboard")) return "⌨️";
  if (text.includes("phone") || text.includes("mobile")) return "📱";
  if (text.includes("headphone") || text.includes("earbud")) return "🎧";
  if (text.includes("camera")) return "📷";
  if (text.includes("tablet")) return "📲";
  return "📦";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

// Loop search with continue and early return.
function searchProduct(name) {
  for (const product of inventory) {
    if (!product.name) continue;
    if (product.name.toLowerCase() === name.trim().toLowerCase()) return product;
  }
  return null;
}

function searchById(id) {
  for (const product of inventory) {
    if (product.id === id) return product;
  }
  return null;
}

function getFilteredProducts() {
  const query = $("#search-input").value.trim().toLowerCase();
  const category = $("#category-filter").value;
  return inventory.filter((product) => {
    const nameMatches = product.name.toLowerCase().includes(query);
    const categoryMatches = category === "All" || getCategory(product.price) === category;
    return nameMatches && categoryMatches;
  });
}

function renderInventory() {
  const tbody = $("#inventory-body");
  const visible = getFilteredProducts();
  tbody.innerHTML = "";

  visible.forEach((product, index) => {
    const category = getCategory(product.price);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${String(index + 1).padStart(2, "0")}</td>
      <td><div class="product-name-cell"><span class="product-thumb">${product.icon}</span><span><span class="product-name-text">${escapeHTML(product.name)}</span><small class="product-sku">SKU-${String(product.id).padStart(4, "0")}</small></span></div></td>
      <td class="price-cell">${money(product.price)}</td>
      <td><span class="badge ${categoryClass(category)}">${category}</span></td>
      <td><button class="row-action" data-action="edit" data-id="${product.id}" title="Edit product" aria-label="Edit ${escapeHTML(product.name)}">✎</button><button class="row-action delete" data-action="delete" data-id="${product.id}" title="Delete product" aria-label="Delete ${escapeHTML(product.name)}">×</button></td>`;
    tbody.appendChild(row);
  });

  $("#empty-state").classList.toggle("hidden", visible.length > 0);
  $("#table-count").textContent = `${inventory.length} item${inventory.length === 1 ? "" : "s"}`;
  $("#sidebar-count").textContent = inventory.length;
  $("#table-summary").textContent = `Showing ${visible.length} of ${inventory.length} product${inventory.length === 1 ? "" : "s"}`;
  renderAnalytics();
}

function renderAnalytics() {
  const total = calculateInventoryValue(inventory);
  const affordable = inventory.filter((product) => product.price < 200);
  const premium = inventory.filter((product) => product.price >= 200);
  const totalCount = inventory.length;
  const affordablePercent = totalCount ? Math.round(affordable.length / totalCount * 100) : 0;

  $("#inventory-value").textContent = money(total);
  $("#total-products").textContent = totalCount;
  $("#affordable-count").textContent = affordable.length;
  $("#premium-count").textContent = premium.length;
  $("#product-status").textContent = totalCount ? "TRACKING" : "EMPTY";
  $("#donut-total").textContent = shortMoney(total);
  $("#chart-products").textContent = totalCount;
  $("#report-affordable").textContent = `${affordable.length} item${affordable.length === 1 ? "" : "s"}`;
  $("#affordable-progress").style.width = `${affordablePercent}%`;

  const highest = inventory.reduce((best, product) => !best || product.price > best.price ? product : best, null);
  $("#highest-product").textContent = highest ? highest.name : "No products";
  $("#highest-description").textContent = highest ? `${money(highest.price)} · ${getCategory(highest.price)}` : "Add a product to get started";

  // map() transforms inventory data into a formatted report.
  const formatted = inventory.map((product) =>
    `<li>${escapeHTML(product.name.toUpperCase())}<span>${money(product.price)}</span></li>`
  );
  $("#formatted-list").innerHTML = formatted.join("") || "<li>No products yet</li>";

  renderDonut();
  renderCategories();
}

function renderDonut() {
  const total = calculateInventoryValue(inventory);
  const palette = ["#a18aff", "#5cd5b1", "#e9ad68", "#82a8ff", "#f28dc8", "#d6a8ff"];
  let current = 0;
  const segments = inventory.map((product, index) => {
    const start = current;
    current += total ? product.price / total * 100 : 0;
    return `${palette[index % palette.length]} ${start}% ${current}%`;
  });
  $("#value-donut").style.background = segments.length ? `conic-gradient(${segments.join(",")})` : "#333";
  const legend = $("#value-legend");
  legend.innerHTML = "";
  inventory.slice().sort((a, b) => b.price - a.price).forEach((product) => {
    const originalIndex = inventory.findIndex((item) => item.id === product.id);
    const share = total ? (product.price / total * 100).toFixed(1) : "0.0";
    const item = document.createElement("div");
    item.className = "legend-row";
    item.innerHTML = `<span class="legend-dot" style="background:${palette[originalIndex % palette.length]}"></span><span>${escapeHTML(product.name)}</span><strong>${share}%</strong><small>${money(product.price)}</small>`;
    legend.appendChild(item);
  });
  if (!inventory.length) legend.innerHTML = '<div class="legend-row">No products yet</div>';
}

function renderCategories() {
  const container = $("#category-breakdown");
  container.innerHTML = "";
  const categories = [
    { name: "Premium", description: "$200 and above", color: "#a18aff" },
    { name: "Standard", description: "$50 – $199.99", color: "#5cd5b1" },
    { name: "Budget", description: "Below $50", color: "#e9ad68" }
  ];
  categories.forEach((category) => {
    const count = inventory.filter((product) => getCategory(product.price) === category.name).length;
    const percent = inventory.length ? count / inventory.length * 100 : 0;
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `<div class="category-row-head"><span class="category-name"><span class="legend-dot" style="background:${category.color}"></span>${category.name}<small style="color:#74788e;margin-left:4px">${category.description}</small></span><span class="category-count">${count}</span></div><div class="category-bar"><span style="width:${percent}%;background:${category.color}"></span></div>`;
    container.appendChild(row);
  });
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

const dialog = $("#product-dialog");
function openDialog(product = null) {
  editingId = product ? product.id : null;
  $("#product-form").reset();
  $("#form-message").textContent = "";
  $("#dialog-title").textContent = product ? "Edit product" : "Add a new product";
  $("#submit-product").innerHTML = product ? 'Save changes <span>→</span>' : 'Add to inventory <span>→</span>';
  if (product) {
    $("#product-name").value = product.name;
    $("#product-price").value = product.price;
  }
  if (!dialog.open) dialog.showModal();
  $("#product-name").focus();
}

function addUsingPrompt() {
  let name = prompt("Enter product name (Cancel to stop):");
  // break exits when the user cancels; blank input is retried.
  while (name !== null && name.trim() === "") {
    alert("Product name cannot be empty.");
    name = prompt("Enter product name (Cancel to stop):");
    if (name === null) break;
  }
  if (name === null) return;

  const priceText = prompt(`Enter price for ${name.trim()}:`);
  if (priceText === null || priceText.trim() === "") {
    alert("Price is required. Product was not added.");
    return;
  }
  const price = Number(priceText); // explicit type conversion
  if (!Number.isFinite(price) || price <= 0) {
    alert("Please enter a valid price greater than zero.");
    return;
  }
  inventory.push({ id: nextId++, name: name.trim(), price, icon: iconFor(name) });
  renderInventory();
  showToast(`${name.trim()} added successfully.`);
}

$("#product-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#product-name").value.trim();
  const price = Number($("#product-price").value);
  if (!name) {
    $("#form-message").textContent = "Please enter a product name.";
    return;
  } else if (!Number.isFinite(price) || price <= 0) {
    $("#form-message").textContent = "Enter a valid price greater than zero.";
    return;
  }

  if (editingId !== null) {
    const product = searchById(editingId);
    if (product) Object.assign(product, { name, price, icon: iconFor(name) });
    showToast(`${name} updated.`);
  } else {
    inventory.push({ id: nextId++, name, price, icon: iconFor(name) });
    showToast(`${name} added as ${getCategory(price)}.`);
  }
  dialog.close();
  renderInventory();
});

$("#close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

$("#inventory-body").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const product = searchById(Number(button.dataset.id));
  if (!product) return;
  if (button.dataset.action === "edit") {
    openDialog(product);
  } else if (button.dataset.action === "delete") {
    if (confirm(`Delete "${product.name}" from inventory?`)) {
      const index = inventory.findIndex((item) => item.id === product.id);
      if (index !== -1) inventory.splice(index, 1);
      renderInventory();
      showToast(`${product.name} deleted.`);
    }
  }
});

$("#search-input").addEventListener("input", renderInventory);
$("#category-filter").addEventListener("change", renderInventory);
["#add-top", "#add-table", "#empty-add"].forEach((selector) => $(selector).addEventListener("click", () => openDialog()));
$("#prompt-add").addEventListener("click", addUsingPrompt);

function exportCSV() {
  const rows = [["Product", "Price", "Category", "SKU"]];
  inventory.forEach((product) => {
    rows.push([product.name, product.price.toFixed(2), getCategory(product.price), `SKU-${String(product.id).padStart(4, "0")}`]);
  });
  rows.push([], ["Total inventory value", calculateInventoryValue(inventory).toFixed(2)]);
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stocknest-inventory-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("CSV report downloaded.");
}
$("#export-quick").addEventListener("click", exportCSV);
document.querySelector('[data-action="export"]').addEventListener("click", exportCSV);

$("#copy-report").addEventListener("click", async () => {
  const lines = ["StockNest Inventory Report", ...inventory.map((p) => `${p.name}: ${money(p.price)} — ${getCategory(p.price)}`), `Total: ${money(calculateInventoryValue(inventory))}`];
  const report = lines.join("\n");
  try {
    await navigator.clipboard.writeText(report);
    showToast("Report copied to clipboard.");
  } catch {
    const area = document.createElement("textarea");
    area.value = report;
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    showToast(copied ? "Report copied to clipboard." : "Copy was blocked by your browser.");
  }
});

$("#calculate-open").addEventListener("click", () => {
  $("#tax-panel").classList.toggle("hidden");
  $("#tax-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
});
$("#calculate-total").addEventListener("click", () => {
  const tax = Number($("#tax-rate").value);
  const discount = Number($("#discount-rate").value);
  const output = $("#final-total");
  if (!Number.isFinite(tax) || !Number.isFinite(discount) || tax < 0 || discount < 0 || tax > 100 || discount > 100) {
    output.textContent = "Tax and discount must both be between 0 and 100.";
    return;
  }
  const subtotal = calculateInventoryValue(inventory);
  output.textContent = `Subtotal ${money(subtotal)} + tax ${money(subtotal * tax / 100)} − discount ${money(subtotal * discount / 100)} = ${money(calculateFinalTotal(subtotal, tax, discount))}`;
});

document.querySelectorAll(".nav-link[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
document.querySelector('.nav-link[data-action="add"]').addEventListener("click", openDialog);

$("#theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  showToast(document.body.classList.contains("light") ? "Light theme enabled." : "Dark theme enabled.");
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openDialog();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
    event.preventDefault();
    $("#search-input").focus();
  }
  if (event.key === "Escape" && dialog.open) dialog.close();
});

$("#today-date").textContent = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
renderInventory();

// Console output for capstone evaluation.
console.log("--- Initializing Inventory System ---");
console.log("Initial inventory:", inventory);
console.log("--- Processing Inventory Roster (forEach) ---");
inventory.forEach((product) => console.log(`* Item: ${product.name} (${money(product.price)}) -> Category: ${getCategory(product.price)}`));
console.log("--- Financial Analytics ---");
console.log("Total Inventory Value:", money(calculateInventoryValue(inventory)));
console.log("Filtered Affordable Items (Under $200):", inventory.filter((product) => product.price < 200).map((product) => product.name));
console.log("Formatted Report List:", inventory.map((product) => `${product.name.toUpperCase()}: ${money(product.price)}`));
