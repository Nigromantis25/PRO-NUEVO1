// Capa ligera para productos usando Supabase (si `window.supabaseClient` existe)
(function(){
  if(!window.supabaseClient){
    // No hay cliente: no hacemos nada
    return;
  }

  const api = {
    async fetchProducts(){
      try{
        const resp = await window.supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if(resp.error) throw resp.error;
        return resp.data || [];
      }catch(e){ console.warn('fetchProducts error', e); return []; }
    },
    async createProduct(prod){
      try{
        // prod debe ser { name, price, stock, img }
        const toInsert = Object.assign({}, prod);
        // Si no hay created_at, Supabase lo puede añadir automáticamente
        const resp = await window.supabaseClient
          .from('products')
          .insert([toInsert])
          .select();
        if(resp.error) throw resp.error;
        return (resp.data && resp.data[0]) || null;
      }catch(e){ console.warn('createProduct error', e); throw e; }
    }
  };

  window.stockApi = api;
})();
