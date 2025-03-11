document.getElementById('stock-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('item-name').value;
    const qty = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const total = (qty * price).toFixed(2);
    const tbody = document.getElementById('stock-body');
    const row = `<tr><td>${tbody.children.length + 1}</td><td>${name}</td><td>${qty}</td><td>$${price}</td><td>$${total}</td></tr>`;
    tbody.innerHTML += row;
    this.reset();
});