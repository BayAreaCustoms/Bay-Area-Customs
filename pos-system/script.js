const cart = [];
let discountApplied = false;

document.addEventListener("DOMContentLoaded", () => {
  loadItems();
  loadDepartments();

  document.getElementById('apply-discount').addEventListener('click', () => {
    discountApplied = true;
    updateCart();
  });

  document.getElementById('copy-order').addEventListener('click', copyOrder);
  document.getElementById('submit-order').addEventListener('click', submitOrder);
});

function loadItems() {
  fetch('items.json')
    .then(response => response.json())
    .then(data => {
      const itemsDiv = document.getElementById('items');
      itemsDiv.innerHTML = "";

      data.forEach(item => {
        const btn = document.createElement('button');

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;

        const name = document.createElement('span');
        name.textContent = item.name;

        const price = document.createElement('span');
        price.textContent = `$${item.price.toFixed(2)}`;

        btn.appendChild(img);
        btn.appendChild(name);
        btn.appendChild(price);
        btn.onclick = () => addToCart(item);

        itemsDiv.appendChild(btn);
      });
    });
}



function loadDepartments() {
  const select = document.getElementById('department');
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.name;
    option.textContent = dept.name;
    option.dataset.webhook = dept.webhook;
    select.appendChild(option);
  });
}

function addToCart(item) {
  const found = cart.find(i => i.id === item.id);
  if (found) {
    found.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  updateCart();
}

function updateCart() {
  const cartList = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  cartList.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.name} - $${item.price}`;

    const qtyInput = document.createElement('input');
    qtyInput.type = "number";
    qtyInput.min = 1;
    qtyInput.value = item.quantity;
    qtyInput.onchange = e => {
      item.quantity = parseInt(e.target.value) || 1;
      updateCart();
    };

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'X';
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
    total *= 0.9;
  }

  totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

function copyOrder() {
  const name = document.getElementById('callsign').value;
  const dept = document.getElementById('department');
  const webhook = dept.options[dept.selectedIndex].dataset.webhook;

  if (!name) return alert("Please enter a name.");

  let total = 0;
  let output = `Name: ${name}\nDepartment: ${dept.value}\nOrder:\n`;

  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    output += `- ${item.name} ($${item.price.toFixed(2)}) x${item.quantity} = $${subtotal.toFixed(2)}\n`;
  });

  if (discountApplied) {
    total *= 0.9;
    output += `\nDiscount Applied: 10%`;
  }

  output += `\nTotal Cost: $${total.toFixed(2)}`;

  navigator.clipboard.writeText(output).then(() => {
    alert("Order copied to clipboard!");
  });
}

function submitOrder() {
  const name = document.getElementById('callsign').value;
  const dept = document.getElementById('department');
  const webhook = dept.options[dept.selectedIndex].dataset.webhook;

  if (!name) return alert("Please enter a name.");

  let total = 0;
  let message = `**Name:** ${name}\n**Department:** ${dept.value}\n**Order:**\n`;

  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    message += `- ${item.name} ($${item.price.toFixed(2)}) x${item.quantity} = $${subtotal.toFixed(2)}\n`;
  });

  if (discountApplied) {
    total *= 0.9;
    message += `\n**Discount Applied: 10%**`;
  }

  message += `\n**Total Cost: $${total.toFixed(2)}**`;

  fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  }).then(() => {
    alert("Order submitted to Discord!");
  }).catch(err => {
    console.error("Webhook error:", err);
    alert("Failed to submit order.");
  });
}
