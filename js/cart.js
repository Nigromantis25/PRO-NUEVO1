// cart.js - Carrito, checkout e impresión
(function(){
  // Helpers
  function qs(sel, ctx){ return (ctx||document).querySelector(sel); }
  function qsa(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }

  function getUser(){
    try { return JSON.parse(localStorage.getItem('sd_user')); } catch(e){ return null; }
  }
  function saveCart(cart){ localStorage.setItem('sd_cart', JSON.stringify(cart)); }
  function loadCart(){ try{ return JSON.parse(localStorage.getItem('sd_cart'))||[]; }catch(e){return [];} }

  // Migrar otros keys de carrito antiguos a 'sd_cart' para compatibilidad
  function migrateStorage(){
    try{
      if(localStorage.getItem('sd_cart')) return; // ya existe
      // claves antiguas que se han usado en distintas páginas
      const altKeys = ['cart','kaira_cart_v1'];
      for(const k of altKeys){
        const raw = localStorage.getItem(k);
        if(raw){
          try{
            const parsed = JSON.parse(raw);
            if(Array.isArray(parsed)){
              localStorage.setItem('sd_cart', JSON.stringify(parsed));
              localStorage.removeItem(k);
              console.info('Migrated cart from', k);
              return;
            }
          }catch(e){ /* ignore */ }
        }
      }
    }catch(e){ console.warn('migrateStorage error', e); }
  }

  // Overlay que bloquea la app si el usuario no tiene rol permitido
  function ensureAccess(){
    // El overlay queda deshabilitado, acceso libre a toda la app
    let overlay = document.getElementById('accessOverlay');
    if(overlay){ overlay.remove(); }
    document.documentElement.style.overflow = '';
  }

  // Render del carrito en el offcanvas
  function renderCart(){
    const cart = loadCart();
    const list = qs('#cartList');
    const countEls = qsa('.cart-count');
    const cartCountBadge = qs('#cartCount');
    if(!list) return;
    list.innerHTML = '';
    let total = 0;
    cart.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start';
      li.innerHTML = `
        <div class="ms-2 me-auto">
          <div class="fw-bold">${escapeHtml(item.name)}</div>
          <small>Cantidad: ${item.quantity}</small>
        </div>
        <div class="text-end">
          <div>${formatPrice(item.price * item.quantity)}</div>
          <div class="mt-2"><button class="btn btn-sm btn-outline-danger remove-item" data-idx="${idx}">Eliminar</button></div>
        </div>
      `;
      list.appendChild(li);
      // attach remove handler to freshly created button
      const removeBtn = li.querySelector('.remove-item');
      if(removeBtn){
        removeBtn.addEventListener('click', function(e){
          e.preventDefault();
          const idx = parseInt(this.dataset.idx, 10);
          const cart = loadCart();
          cart.splice(idx, 1);
          saveCart(cart);
          renderCart();
        });
      }
      total += item.price * item.quantity;
    });

    qs('#cartTotal').textContent = formatPrice(total);
    const c = cart.reduce((s,i)=>s+i.quantity,0);
    countEls.forEach(el=>el.textContent = `(${c})`);
    if(cartCountBadge) cartCountBadge.textContent = c;
  }

  function formatPrice(n){ return '$' + Number(n).toFixed(2); }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; }); }

  // Añadir producto al carrito
  function addToCart(product){
    const cart = loadCart();
    const existing = cart.find(i=>i.id === product.id);
    if(existing){ existing.quantity += product.quantity; }
    else cart.push(product);
    saveCart(cart);
    renderCart();
  }

  // Extraer datos del elemento de producto
  function productFromElement(el){
    // Si hay wrapper con data-id/data-price
    const prodWrap = el.closest('.producto') || el.closest('.product-item') || el.closest('[data-id]');
    let id = null, name = null, price = 0;
    let image = '';
    if(prodWrap){
      if(prodWrap.dataset && prodWrap.dataset.id) id = prodWrap.dataset.id;
      const img = prodWrap.querySelector('img');
      if(prodWrap.dataset && prodWrap.dataset.image) image = prodWrap.dataset.image;
      if(!image && img) image = img.getAttribute('src') || img.getAttribute('alt') || '';
      if(!id && img) id = img.getAttribute('src') || img.getAttribute('alt');
      // name prefer h5 or alt
      const titleEl = prodWrap.querySelector('h5') || prodWrap.querySelector('.product-description') || prodWrap.querySelector('a');
      name = titleEl ? titleEl.textContent.trim() : (img?img.alt:'Producto');
      // price: data-price or span inside anchor
      if(prodWrap.dataset && prodWrap.dataset.price) price = Number(prodWrap.dataset.price)||0;
      else {
        const priceSpan = prodWrap.querySelector('.product-content a span') || prodWrap.querySelector('.product-price strong') || prodWrap.querySelector('.product-price');
        if(priceSpan) price = parseFloat((priceSpan.textContent||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;
        else {
          // fallback: try nearby span
          const s = el.querySelector('span') || el.closest('a') && el.closest('a').querySelector('span');
          if(s) price = parseFloat((s.textContent||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;
        }
      }
    }
    if(!id) id = 'p-' + Math.random().toString(36).slice(2,9);
    return { id: String(id), name: name || 'Producto', price: Number(price)||0, quantity: 1, image: image };
  }

  // Eventos
  function initEvents(){
    // Delegación: manejar botones con clases .addToCart y .add-to-cart y elementos con data-id
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.addToCart, .add-to-cart, button[data-id], a[data-after]');
      if(!btn) return;
      e.preventDefault();
      if(!isUserAllowed()){ showLoginRequired(); return; }
      const prod = productFromElement(btn);
      addToCart(prod);
      // feedback
      try{ alert(`${prod.name} añadido al carrito.`); }catch(e){}
      // Abrir offcanvas si existe bootstrap offcanvas
      try{ const off = new bootstrap.Offcanvas(qs('#offcanvasCart')); off.show(); }catch(e){}
    }, false);

    // Añadir desde enlaces de producto que tienen data-after (los price links)
    qsa('.product-content a[data-after]').forEach(a => a.addEventListener('click', function(e){
      e.preventDefault();
      if(!isUserAllowed()){ showLoginRequired(); return; }
      const prod = productFromElement(this);
      addToCart(prod);
      try{ const off = new bootstrap.Offcanvas(qs('#offcanvasCart')); off.show(); }catch(e){}
    }));

    // Eliminar producto desde botones .remove-item
    qsa('.remove-item').forEach(btn => btn.addEventListener('click', function(e){
      e.preventDefault();
      const idx = parseInt(this.dataset.idx, 10);
      const cart = loadCart();
      cart.splice(idx, 1);
      saveCart(cart);
      renderCart();
    }));

    // Finalizar compra
    const checkoutBtn = qs('#checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Gracias por tu compra.');
        localStorage.removeItem('sd_cart');
        renderCart();
      });
    }
  }

  function isUserAllowed(){ return true; }
  function showLoginRequired(){ try{ var modal = new bootstrap.Modal(qs('#loginModal')); modal.show(); }catch(e){ alert('Debes iniciar sesión con rol vendedor o administrador.'); } }

  function generatePrintableAndPrint(){
    const cart = loadCart();
    const name = qs('#buyerName').value||'';
    const email = qs('#buyerEmail').value||'';
    const phone = qs('#buyerPhone').value||'';
    const address = qs('#buyerAddress').value||'';
    let html = `<html><head><title>Orden - ${escapeHtml(name)}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head><body>`;
    html += `<h2>Orden de ${escapeHtml(name)}</h2>`;
    html += `<div>Correo: ${escapeHtml(email)}<br/>Tel: ${escapeHtml(phone)}<br/>Dirección: ${escapeHtml(address)}</div>`;
    html += `<h3>Productos</h3><table><thead><tr><th>Producto</th><th>Cant</th><th>Precio</th></tr></thead><tbody>`;
    let total = 0;
    cart.forEach(it=>{ html += `<tr><td>${escapeHtml(it.name)}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${formatPrice(it.price*it.quantity)}</td></tr>`; total += it.price*it.quantity; });
    html += `</tbody><tfoot><tr><th colspan="2">Total</th><th style="text-align:right">${formatPrice(total)}</th></tr></tfoot></table>`;
    html += `</body></html>`;
    const w = window.open('', '_blank');
    if(!w){ alert('Permite ventanas emergentes para imprimir.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(()=>{ w.print(); },300);
  }

  // Observador de cambios en login (login.js guardará sesión). Aquí simplemente detectamos cambios en localStorage.
  function storageListener(e){
    if(e.key === 'sd_user'){
      document.body.dispatchEvent(new CustomEvent('sd:user-changed'));
    }
    if(e.key === 'sd_cart'){
      renderCart();
    }
  }
  window.addEventListener('storage', storageListener);

  // Inicialización
  document.addEventListener('DOMContentLoaded', function(){
    // migrar datos de keys antiguos si existen
    migrateStorage();
    // render al cargar
    renderCart();
    initEvents();
    ensureAccess();

    // También actualizar UI inicial de badges
    qsa('.cart-count').forEach(el=>{
      const cart = loadCart(); const c = cart.reduce((s,i)=>s+i.quantity,0); el.textContent = `(${c})`; });
  });

  // Exponer API mínima global para páginas que no usan el mismo script
  window.sdCart = {
    load: loadCart,
    save: saveCart,
    add: function(p){ addToCart(p); },
    render: renderCart,
  };

})();
