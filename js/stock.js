  // Renderizar productos en la sección Tote Bags
  function renderToteBags(){
    const stock = loadStock();
    const toteList = qs('#tote-bags-list');
    if(!toteList) return;
    toteList.innerHTML = '';
    // Mostrar máximo 3 productos, reemplazando el más antiguo si se añade uno nuevo
    const productos = stock.slice(-3); // últimos 3
    productos.forEach((prod, idx) => {
      toteList.innerHTML += `<div class="col-md-4 mb-4">
        <div class="card h-100">
          ${prod.img ? `<img src="${prod.img}" class="card-img-top" alt="${escapeHtml(prod.name)}">` : '<span class="text-muted">Sin imagen</span>'}
          <div class="card-body">
            <h5 class="card-title">${escapeHtml(prod.name)}</h5>
            <p class="card-text">${prod.desc ? escapeHtml(prod.desc) : 'Producto añadido desde el stock.'}</p>
            <span class="badge bg-success mb-2">$${Number(prod.price).toFixed(2)}</span>
            <button class="btn btn-primary add-to-cart" data-id="${prod.id}">Agregar al carrito</button>
          </div>
        </div>
      </div>`;
    });
    addToteBagListeners();
  }
// stock.js - Gestión de stock y productos
(function(){
  // Helpers
  function qs(sel, ctx){ return (ctx||document).querySelector(sel); }
  function qsa(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; }); }

  // Stock en localStorage
  function loadStock(){ try{ return JSON.parse(localStorage.getItem('sd_stock'))||[]; }catch(e){return [];} }
  function saveStock(stock){ localStorage.setItem('sd_stock', JSON.stringify(stock)); }

  // Renderizar lista de productos en el modal
  function renderStock(){
    const stock = loadStock();
    const list = qs('#stockList');
    if(!list) return;
    if(stock.length === 0){ list.innerHTML = '<div class="text-muted">No hay productos en stock.</div>'; return; }
    let html = '<table class="table table-bordered table-sm align-middle"><thead><tr><th>Imagen</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>';
    stock.forEach((prod, idx) => {
      html += `<tr>
        <td>${prod.img ? `<img src="${prod.img}" alt="img" style="max-width:60px;max-height:60px;">` : '<span class="text-muted">Sin imagen</span>'}</td>
        <td>${escapeHtml(prod.name)}</td>
        <td>$${Number(prod.price).toFixed(2)}</td>
        <td>${prod.stock}</td>
        <td>
          <button class="btn btn-sm btn-primary add-stock" data-idx="${idx}">+</button>
          <button class="btn btn-sm btn-danger remove-stock" data-idx="${idx}">-</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    list.innerHTML = html;
  }

  // Abrir modal stock
  document.addEventListener('DOMContentLoaded', function(){
    const btnStock = qs('#btnStock');
    if(btnStock){
      btnStock.addEventListener('click', function(e){
        e.preventDefault();
        renderStock();
        try{ var modal = new bootstrap.Modal(qs('#stockModal')); modal.show(); }catch(e){ alert('Abre el modal de stock'); }
      });
    }
  });

  // Agregar producto
  document.addEventListener('DOMContentLoaded', function(){
    const form = qs('#addProductForm');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const name = qs('#newProdName').value.trim();
        const price = Number(qs('#newProdPrice').value);
        const stock = Number(qs('#newProdStock').value);
        const imgInput = qs('#newProdImg');
        if(!name || price<=0 || stock<=0){ alert('Completa todos los campos correctamente.'); return; }
        let imgData = '';
        if(imgInput && imgInput.files && imgInput.files[0]){
          const file = imgInput.files[0];
          const reader = new FileReader();
          reader.onload = function(ev){
            imgData = ev.target.result;
            addProduct(name, price, stock, imgData);
          };
          reader.readAsDataURL(file);
        } else {
          addProduct(name, price, stock, '');
        }
      });
    }
  });

  function addProduct(name, price, stock, img){
    const products = loadStock();
    products.push({ id: 'p'+Date.now(), name, price, stock, img });
    saveStock(products);
    renderStock();
    renderToteBags();
    // Limpiar form
    if(qs('#addProductForm')) qs('#addProductForm').reset();
  // Renderizar Tote Bags al cargar la página
  document.addEventListener('DOMContentLoaded', function(){
    renderToteBags();
  });
  // Actualizar Tote Bags cuando cambie el stock
  window.addEventListener('storage', function(e){
    if(e.key === 'sd_stock') renderToteBags();
  });
  }

  // Acciones de stock + y -
  document.body.addEventListener('click', function(e){
    if(e.target && e.target.classList.contains('add-stock')){
      const idx = Number(e.target.dataset.idx);
      const products = loadStock();
      if(products[idx]){ products[idx].stock += 1; saveStock(products); renderStock(); }
    }
    if(e.target && e.target.classList.contains('remove-stock')){
      const idx = Number(e.target.dataset.idx);
      const products = loadStock();
      if(products[idx] && products[idx].stock > 0){ products[idx].stock -= 1; saveStock(products); renderStock(); }
    }
  });

  // Integración con carrito: reducir stock al comprar
  window.reduceStockOnPurchase = function(productId, qty){
    const products = loadStock();
    const prod = products.find(p=>p.id===productId);
    if(prod && prod.stock>=qty){ prod.stock -= qty; saveStock(products); }
  };

})();
