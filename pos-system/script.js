const cart = [];
let discountApplied = false; // Track discount status

document.addEventListener("DOMContentLoaded", () => {
    loadItems();
    loadDepartments();

    // Add event listener for the discount button
    document.getElementById('apply-discount').addEventListener('click', () => {
        discountApplied = true;
        updateCart();
    });
});

function loadItems() {
    fetch('items.json')
        .then(response => response.json())
        .then(data => {
            let itemsDiv = document.getElementById('items');
            itemsDiv.innerHTML = ""; // Clear previous items

            data.forEach(item => {
                // Create item container div
                let itemDiv = document.createElement('div');
                itemDiv.classList.add('item');

                // Add the item image
                let itemImage = document.createElement('img');
                itemImage.src = item.image; // Set the image source
                itemImage.alt = item.name; // Set alt text for accessibility
                itemImage.classList.add('item-image'); // Add class for styling

                // Create the item button with name and price
                let btn = document.createElement('button');
                btn.textContent = `${item.name} - $${item.price}`;
                btn.onclick = () => addToCart(item);

                // Append image and button to the item container
                itemDiv.appendChild(itemImage);
                itemDiv.appendChild(btn);

                // Append the item container to the items div
                itemsDiv.appendChild(itemDiv);
            });
        });
}


function loadDepartments() {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect || !departments) return;

    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        option.dataset.webhook = dept.webhook;
        departmentSelect.appendChild(option);
    });
}



function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCart();
}

function updateCart() {
    let cartList = document.getElementById('cart-items');
    let totalElement = document.getElementById('cart-total');
    cartList.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {
        let li = document.createElement('li');

        let nameSpan = document.createElement('span');
        nameSpan.textContent = `${item.name} - $${item.price}`;

        let qtyInput = document.createElement('input');
        qtyInput.type = "number";
        qtyInput.min = 1;
        qtyInput.value = item.quantity;
        qtyInput.onchange = (e) => {
            item.quantity = parseInt(e.target.value) || 1;
            updateCart();
        };

        let removeBtn = document.createElement('button');
        removeBtn.textContent = "Remove";
        removeBtn.classList.add('remove-btn'); // Add the remove-btn class
        removeBtn.onclick = () => {
            cart.splice(index, 1);
            updateCart();
};


        li.appendChild(nameSpan);
        li.appendChild(qtyInput);
        li.appendChild(removeBtn);
        cartList.appendChild(li);

        total += item.price * item.quantity;
    });

    if (discountApplied) {
        total *= 0.9; // Apply 10% discount
    }

    totalElement.textContent = `Total: $${total.toFixed(2)}`;
}

function copyOrder() {
    const department = document.getElementById('department').value;
    const name = document.getElementById('name').value;

    if (!name) {
        alert("Please enter a name.");
        return;
    }

    let total = 0;
    let orderText = `Name: ${name}\nDepartment: ${department}\nOrder:\n`;

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        orderText += `- ${item.name} ($${item.price.toFixed(2)}) x${item.quantity} = $${itemTotal.toFixed(2)}\n`;
        total += itemTotal;
    });

    if (discountApplied) {
        total *= 0.9; // Apply 10% discount
        orderText += `\n**Discount Applied: 10%**`;
    }

    orderText += `\n**Total Cost: $${total.toFixed(2)}**`;

    navigator.clipboard.writeText(orderText).then(() => {
        alert("Order copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy order: ", err);
        alert("Failed to copy order. Please try again.");
    });
}





function submitOrder() {
    const departmentSelect = document.getElementById('department');
    const selectedOption = departmentSelect.options[departmentSelect.selectedIndex];
    const webhookURL = selectedOption.dataset.webhook;

    const name = document.getElementById('callsign').value;

    if (!name) {
        alert("Please enter a name.");
        return;
    }

    let total = 0;
    let orderText = `**Name:** ${name}\n**Department:** ${selectedOption.value}\n**Order:**\n`;

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        orderText += `- ${item.name} ($${item.price.toFixed(2)}) x${item.quantity} = $${itemTotal.toFixed(2)}\n`;
        total += itemTotal;
    });

    if (discountApplied) {
        total *= 0.9;
        orderText += `\n**Discount Applied: 10%**`;
    }

    orderText += `\n**Total Cost: $${total.toFixed(2)}**`;

    fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: orderText })
    }).then(() => alert("Order submitted to Discord!"));
}




