(() => {
  const cartKey = 'patitas-felices-carrito-v1';
  const cart = new Map();
  const formatter = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
  const productRows = document.getElementById('carrito-productos');
  const cartTable = document.getElementById('tabla-carrito');
  const emptyMessage = document.getElementById('carrito-vacio');
  const totalElement = document.getElementById('carrito-total');
  const countElement = document.getElementById('contador-carrito');
  const announcement = document.getElementById('carrito-anuncio');
  const clearButton = document.getElementById('vaciar-carrito');
  const checkoutButton = document.getElementById('finalizar-carrito');
  const checkoutForm = document.getElementById('formulario-pedido');
  const deliverySelect = document.getElementById('metodo-entrega');
  const addressFields = document.getElementById('datos-direccion');
  const addressInput = document.getElementById('cliente-direccion');
  const districtInput = document.getElementById('cliente-distrito');

  function saveCart() {
    try {
      localStorage.setItem(cartKey, JSON.stringify([...cart.values()]));
    } catch {
      announcement.textContent = 'No se pudo guardar el carrito en este navegador.';
    }
  }

  function loadCart() {
    try {
      const savedItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
      if (!Array.isArray(savedItems)) return;
      savedItems.forEach((item) => {
        if (typeof item.name !== 'string' || !Number.isFinite(item.price) || item.price <= 0) return;
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return;
        cart.set(item.name, {
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: typeof item.image === 'string' && item.image.startsWith('img/productos/') ? item.image : ''
        });
      });
    } catch {
      cart.clear();
    }
  }

  function renderCart() {
    productRows.replaceChildren();
    let total = 0;
    let itemCount = 0;

    cart.forEach((item) => {
      const row = document.createElement('tr');
      const productCell = document.createElement('td');
      const productInfo = document.createElement('div');
      productInfo.className = 'producto-carrito';
      if (item.image) {
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = '';
        productInfo.append(image);
      }
      const name = document.createElement('span');
      name.textContent = item.name;
      productInfo.append(name);
      productCell.append(productInfo);

      const priceCell = document.createElement('td');
      priceCell.textContent = formatter.format(item.price);
      const quantityCell = document.createElement('td');
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.min = '1';
      quantityInput.max = '99';
      quantityInput.step = '1';
      quantityInput.value = String(item.quantity);
      quantityInput.setAttribute('aria-label', `Cantidad de ${item.name}`);
      quantityInput.addEventListener('change', () => {
        const quantity = Number(quantityInput.value);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
          quantityInput.value = String(item.quantity);
          return;
        }
        item.quantity = quantity;
        saveCart();
        renderCart();
      });
      quantityCell.append(quantityInput);

      const subtotal = item.price * item.quantity;
      total += subtotal;
      itemCount += item.quantity;
      const subtotalCell = document.createElement('td');
      subtotalCell.textContent = formatter.format(subtotal);
      const actionCell = document.createElement('td');
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'btn-quitar';
      removeButton.textContent = 'Quitar';
      removeButton.setAttribute('aria-label', `Quitar ${item.name} del carrito`);
      removeButton.addEventListener('click', () => {
        cart.delete(item.name);
        saveCart();
        announcement.textContent = `${item.name} se quitó del carrito.`;
        renderCart();
      });
      actionCell.append(removeButton);
      row.append(productCell, priceCell, quantityCell, subtotalCell, actionCell);
      productRows.append(row);
    });

    const isEmpty = cart.size === 0;
    cartTable.hidden = isEmpty;
    emptyMessage.hidden = !isEmpty;
    totalElement.textContent = formatter.format(total);
    countElement.textContent = String(itemCount);
    countElement.setAttribute('aria-label', `${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`);
    clearButton.disabled = isEmpty;
    checkoutButton.disabled = isEmpty;
    if (isEmpty) checkoutForm.hidden = true;
  }

  document.querySelectorAll('.producto').forEach((product) => {
    const priceText = product.querySelector('.precio:not(.precio-consulta)')?.textContent || '';
    const match = priceText.match(/S\/\s*(\d+(?:\.\d{1,2})?)/);
    const existingLink = product.querySelector(':scope > a.btn');
    if (!match || !existingLink) return;

    const form = document.createElement('form');
    form.className = 'compra-producto';
    const label = document.createElement('label');
    label.append(document.createTextNode('Cantidad'));
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.name = 'cantidad';
    quantityInput.min = '1';
    quantityInput.max = '99';
    quantityInput.step = '1';
    quantityInput.value = '1';
    quantityInput.required = true;
    quantityInput.setAttribute('aria-label', `Cantidad de ${product.querySelector('h2, h3')?.textContent.trim() || 'producto'}`);
    label.append(quantityInput);

    const addButton = document.createElement('button');
    addButton.className = 'btn';
    addButton.type = 'submit';
    addButton.append(document.createTextNode('Agregar'));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '+';
    addButton.append(arrow);
    form.append(label, addButton);
    existingLink.replaceWith(form);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const quantity = Number(quantityInput.value);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        quantityInput.setCustomValidity('Elige una cantidad entre 1 y 99.');
        quantityInput.reportValidity();
        return;
      }
      quantityInput.setCustomValidity('');
      const name = product.querySelector('h2, h3')?.textContent.trim();
      if (!name) return;
      const price = Number(match[1]);
      const current = cart.get(name);
      const nextQuantity = (current?.quantity || 0) + quantity;
      if (nextQuantity > 99) {
        quantityInput.setCustomValidity('El carrito admite hasta 99 unidades por producto.');
        quantityInput.reportValidity();
        return;
      }
      cart.set(name, {
        name,
        price,
        quantity: nextQuantity,
        image: product.querySelector('.img-producto img')?.getAttribute('src') || ''
      });
      saveCart();
      announcement.textContent = `Se agregaron ${quantity} unidades de ${name}.`;
      renderCart();
    });
  });

  clearButton.addEventListener('click', () => {
    cart.clear();
    saveCart();
    announcement.textContent = 'Se vació el carrito.';
    renderCart();
  });

  checkoutButton.addEventListener('click', () => {
    if (cart.size === 0) return;
    checkoutForm.hidden = false;
    document.getElementById('cliente-nombre').focus();
    checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  deliverySelect.addEventListener('change', () => {
    const needsAddress = deliverySelect.value === 'Envío a domicilio';
    addressFields.hidden = !needsAddress;
    addressInput.required = needsAddress;
    districtInput.required = needsAddress;
  });

  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (cart.size === 0 || !checkoutForm.reportValidity()) return;
    const formData = new FormData(checkoutForm);
    const lines = [...cart.values()].map((item) =>
      `- ${item.name} x ${item.quantity}: ${formatter.format(item.price * item.quantity)}`
    );
    const total = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery = formData.get('entrega');
    const address = delivery === 'Envío a domicilio'
      ? `\nDirección: ${formData.get('direccion')}\nDistrito: ${formData.get('distrito')}`
      : '';
    const email = formData.get('correo') ? `\nCorreo: ${formData.get('correo')}` : '';
    const notes = formData.get('indicaciones') ? `\nIndicaciones: ${formData.get('indicaciones')}` : '';
    const message = [
      'SOLICITUD DE PEDIDO - Patitas Felices',
      `Cliente: ${formData.get('nombre')}`,
      `Teléfono: ${formData.get('telefono')}${email}`,
      `Entrega: ${delivery}${address}`,
      `Pago preferido: ${formData.get('pago')}${notes}`,
      '',
      'Productos:',
      ...lines,
      `Total de productos: ${formatter.format(total)}`,
      '',
      'Solicito confirmar disponibilidad, costo de envío e importe final. Entiendo que este mensaje no confirma la venta ni realiza un cobro.'
    ].join('\n');
    window.open(`https://wa.me/51969672510?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });

  loadCart();
  renderCart();
})();