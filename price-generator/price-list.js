
// WITTYFARE PRICE LIST GENERATOR

let products = [];

const currency = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
});

document.getElementById("date").textContent =
    new Date().toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric"
});

function addProduct() {

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("category").value.trim();
    const size = document.getElementById("size").value.trim();
    const price = Number(document.getElementById("price").value);

    if (!name || !category || !size ||
        !document.getElementById("price").value ||
        !Number.isFinite(price) || price <= 0) {

        alert("Please enter all product details correctly.");
        return;
    }

    products.push({
        name,
        category,
        size,
        price
    });

    displayProducts();

    document.getElementById("productName").value = "";
    document.getElementById("category").value = "";
    document.getElementById("size").value = "";
    document.getElementById("price").value = "";
}

function displayProducts() {

    const list = document.getElementById("productList");

    list.innerHTML = "";

    products.forEach((product, index) => {

        const row = document.createElement("tr");

        [
            index + 1,
            product.name,
            product.category,
            product.size,
            currency.format(product.price)
        ].forEach(value => {

            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);

        });

        const action = document.createElement("td");
        action.className = "no-print";

        const remove = document.createElement("button");
        remove.textContent = "Delete";
        remove.style.background = "#dc3545";

        remove.onclick = function() {
            products.splice(index, 1);
            displayProducts();
        };

        action.appendChild(remove);
        row.appendChild(action);

        list.appendChild(row);
    });
}

function printList() {
    if (products.length === 0) {
        alert("Add products before printing.");
        return;
    }

    window.print();
}

function clearList() {

    if (confirm("Delete all products from this price list?")) {
        products = [];
        displayProducts();
    }
}

