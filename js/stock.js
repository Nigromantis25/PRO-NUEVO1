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
          <div class="btn-group" role="group" aria-label="acciones">
            <button class="btn btn-sm btn-success add-stock" data-idx="${idx}">+</button>
            <button class="btn btn-sm btn-warning edit-product" data-idx="${idx}">✎</button>
            <button class="btn btn-sm btn-danger delete-product" data-idx="${idx}">🗑</button>
          </div>
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

  // Agregar producto - registrar el handler al cargar
  document.addEventListener('DOMContentLoaded', function(){
    const form = qs('#addProductForm');
    if(form){
      // evitar validación HTML nativa (usaremos validación personalizada)
      form.setAttribute('novalidate', 'novalidate');
      form.addEventListener('submit', function(e){
        e.preventDefault();
        // limpiar estados previos
        ['#newProdName','#newProdPrice','#newProdStock'].forEach(sel=>{ const el=qs(sel); if(el){ el.classList.remove('is-invalid'); } });

        const nameEl = qs('#newProdName');
        const priceEl = qs('#newProdPrice');
        const stockEl = qs('#newProdStock');
        const name = nameEl ? nameEl.value.trim() : '';
        const price = priceEl ? Number(priceEl.value) : 0;
        const stock = stockEl ? Number(stockEl.value) : 0;
        let hasError = false;
        if(!name){ if(nameEl){ nameEl.classList.add('is-invalid'); qs('#newProdNameFeedback') && (qs('#newProdNameFeedback').textContent='Ingrese un nombre válido.'); } hasError=true; }
        if(!price || price<=0){ if(priceEl){ priceEl.classList.add('is-invalid'); qs('#newProdPriceFeedback') && (qs('#newProdPriceFeedback').textContent='Ingrese un precio mayor a 0.'); } hasError=true; }
        if(!stock || stock<=0){ if(stockEl){ stockEl.classList.add('is-invalid'); qs('#newProdStockFeedback') && (qs('#newProdStockFeedback').textContent='Ingrese cantidad de stock (>=1).'); } hasError=true; }
        if(hasError) return;

        const imgInput = qs('#newProdImg');
        let imgData = '';
        if(imgInput && imgInput.files && imgInput.files[0]){
          const file = imgInput.files[0];
          const reader = new FileReader();
          reader.onload = function(ev){
            imgData = ev.target.result;
            addProduct(name, price, stock, imgData);
            showFormSuccess();
          };
          reader.readAsDataURL(file);
        } else {
          addProduct(name, price, stock, '');
          showFormSuccess();
        }
      });
    }
  });

  function addProduct(name, price, stock, img){
    // Si existe una API remota (Supabase), crear allí; si falla, guardar localmente
    if(window.stockApi && typeof window.stockApi.createProduct === 'function'){
      window.stockApi.createProduct({ name, price, stock, img }).then(created => {
        if(created){
          // actualizar cache local para que la UI funcione offline igual
          const products = loadStock();
          // usar id del backend si lo devuelve
          products.unshift(Object.assign({}, created));
          saveStock(products);
          renderStock();
          renderToteBags();
        }
        if(qs('#addProductForm')) qs('#addProductForm').reset();
      }).catch(err => {
        console.warn('createProduct remote failed, falling back to local', err);
        const products = loadStock();
        products.push({ id: 'p'+Date.now(), name, price, stock, img });
        saveStock(products);
        renderStock();
        renderToteBags();
        if(qs('#addProductForm')) qs('#addProductForm').reset();
      });
      return;
    }
    const products = loadStock();
    products.push({ id: 'p'+Date.now(), name, price, stock, img });
    saveStock(products);
    renderStock();
    renderToteBags();
    // Limpiar form
    if(qs('#addProductForm')) qs('#addProductForm').reset();
  }

  // Sincronizar desde backend (GET) si está disponible
  async function syncFromBackend(){
    if(window.stockApi && typeof window.stockApi.fetchProducts === 'function'){
      try{
        const remote = await window.stockApi.fetchProducts();
        if(Array.isArray(remote) && remote.length>0){
          // Guardar en cache local para uso por las funciones actuales
          saveStock(remote);
        }
      }catch(e){ console.warn('syncFromBackend error', e); }
    }
  }

  // Renderizar Tote Bags al cargar la página
  document.addEventListener('DOMContentLoaded', function(){
    renderToteBags();
  });
  // Actualizar Tote Bags cuando cambie el stock
  window.addEventListener('storage', function(e){
    if(e.key === 'sd_stock') renderToteBags();
  });

  // Inicialización final: sincronizar con backend (si existe) y renderizar
  document.addEventListener('DOMContentLoaded', async function(){
    try{ await syncFromBackend(); }catch(e){}
    renderStock();
    renderToteBags();
  });

  // Añadir listeners a botones "Agregar al carrito" dentro de las Tote Cards
  function addToteBagListeners(){
    const buttons = qsa('.add-to-cart');
    buttons.forEach(btn => {
      btn.removeEventListener && btn.removeEventListener('click', handleToteAdd);
      btn.addEventListener('click', handleToteAdd);
    });
  }

  function handleToteAdd(e){
    e.preventDefault();
    const id = this.dataset.id || (this.getAttribute && this.getAttribute('data-id'));
    if(!id) return;
    const products = loadStock();
    const prod = products.find(p=>p.id===id);
    if(!prod) return;
    // construir objeto de carrito
    const item = { id: prod.id, name: prod.name, price: Number(prod.price)||0, quantity: 1, image: prod.img||'' };
    try{ if(window.sdCart && typeof window.sdCart.add === 'function'){ window.sdCart.add(item); } else if(window.sdCart && window.sdCart.addToCart){ window.sdCart.addToCart(item); } else { alert(item.name + ' añadido al carrito.'); } }catch(e){ console.warn(e); }
    try{ const off = new bootstrap.Offcanvas(qs('#offcanvasCart')); off.show(); }catch(e){}
  }

  function showFormSuccess(){
    const container = qs('#stockModal .modal-body');
    if(!container) return;
    const alertId = 'stock-success-alert';
    let a = qs('#'+alertId);
    if(a) a.remove();
    a = document.createElement('div');
    a.id = alertId;
    a.className = 'alert alert-success mt-2';
    a.textContent = 'Producto agregado al stock.';
    container.insertBefore(a, container.firstChild);
    setTimeout(()=>{ a && a.remove(); }, 3000);
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
    // Edit product
    if(e.target && e.target.classList.contains('edit-product')){
      const idx = Number(e.target.dataset.idx);
      openEditModal(idx);
    }
    // Delete product
    if(e.target && e.target.classList.contains('delete-product')){
      const idx = Number(e.target.dataset.idx);
      const products = loadStock();
      const prod = products[idx];
      if(!prod) return;
      if(!confirm('¿Eliminar "' + prod.name + '" del stock?')) return;
      // If remote API supports delete, try that
      if(window.stockApi && typeof window.stockApi.deleteProduct === 'function' && prod.id){
        window.stockApi.deleteProduct(prod.id).then(()=>{
          products.splice(idx,1); saveStock(products); renderStock(); renderToteBags();
        }).catch(err=>{
          console.warn('remote delete failed, removing local', err);
          products.splice(idx,1); saveStock(products); renderStock(); renderToteBags();
        });
      } else {
        products.splice(idx,1); saveStock(products); renderStock(); renderToteBags();
      }
    }
  });

  // Ensure edit modal exists and open it with product data
  function ensureEditModal(){
    if(qs('#editProductModal')) return;
    const tpl = `<div class="modal fade" id="editProductModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Editar producto</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="editProductForm">
              <input type="hidden" id="editIdx">
              <div class="mb-2"><label class="form-label">Nombre</label><input id="editName" class="form-control" required></div>
              <div class="mb-2"><label class="form-label">Precio</label><input id="editPrice" type="number" step="0.01" class="form-control" required></div>
              <div class="mb-2"><label class="form-label">Stock</label><input id="editStock" type="number" class="form-control" required></div>
              <div class="mb-2"><label class="form-label">Imagen (opcional)</label><input id="editImg" type="file" accept="image/*" class="form-control"></div>
            </form>
          </div>
          <div class="modal-footer"><button id="saveEdit" class="btn btn-primary">Guardar</button><button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button></div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', tpl);
    // attach save handler
    document.body.addEventListener('click', function(e){
      if(e.target && e.target.id === 'saveEdit'){
        e.preventDefault();
        const idx = Number(qs('#editIdx').value);
        const name = qs('#editName').value.trim();
        const price = Number(qs('#editPrice').value);
        const stock = Number(qs('#editStock').value);
        const imgInput = qs('#editImg');
        if(!name || !price || price<=0 || !stock || stock<0){ alert('Por favor completa los campos correctamente.'); return; }
        const products = loadStock();
        const prod = products[idx];
        if(!prod){ alert('Producto no encontrado'); return; }
        function finishUpdate(imgData){
          prod.name = name; prod.price = price; prod.stock = stock; if(imgData) prod.img = imgData;
          // try remote update if available
          if(window.stockApi && typeof window.stockApi.updateProduct === 'function' && prod.id){
            window.stockApi.updateProduct(prod.id, { name, price, stock, img: prod.img }).then(updated=>{
              products[idx] = Object.assign({}, updated);
              saveStock(products); renderStock(); renderToteBags();
              const m = bootstrap.Modal.getInstance(qs('#editProductModal')); m && m.hide();
            }).catch(err=>{
              console.warn('remote update failed, save local', err);
              saveStock(products); renderStock(); renderToteBags();
              const m = bootstrap.Modal.getInstance(qs('#editProductModal')); m && m.hide();
            });
          } else {
            saveStock(products); renderStock(); renderToteBags();
            const m = bootstrap.Modal.getInstance(qs('#editProductModal')); m && m.hide();
          }
        }
        if(imgInput && imgInput.files && imgInput.files[0]){
          const reader = new FileReader(); reader.onload = function(ev){ finishUpdate(ev.target.result); }; reader.readAsDataURL(imgInput.files[0]);
        } else { finishUpdate(); }
      }
    });
  }

  function openEditModal(idx){
    ensureEditModal();
    const products = loadStock();
    const prod = products[idx];
    if(!prod) return alert('Producto no encontrado');
    qs('#editIdx').value = idx;
    qs('#editName').value = prod.name || '';
    qs('#editPrice').value = prod.price || 0;
    qs('#editStock').value = prod.stock || 0;
    if(qs('#editImg')) qs('#editImg').value = '';
    try{ var m = new bootstrap.Modal(qs('#editProductModal')); m.show(); }catch(e){ alert('Abrir modal de edición'); }
  }

  // Integración con carrito: reducir stock al comprar
  window.reduceStockOnPurchase = function(productId, qty){
    const products = loadStock();
    const prod = products.find(p=>p.id===productId);
    if(prod && prod.stock>=qty){ prod.stock -= qty; saveStock(products); }
  };

})();
