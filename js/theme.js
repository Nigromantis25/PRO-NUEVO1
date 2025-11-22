// Theme toggle and image luminance helper
(function(){
  function setTheme(isDark){
    if(isDark) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode');
    try{ localStorage.setItem('siteTheme', isDark? 'dark':'light') }catch(e){}
  }

  function toggleTheme(){
    const isDark = document.body.classList.contains('dark-mode') === false;
    setTheme(isDark);
  }

  function applyStoredTheme(){
    try{
      const t = localStorage.getItem('siteTheme') || 'light';
      setTheme(t === 'dark');
    }catch(e){ setTheme(false) }
  }

  // compute average luminance of an image via canvas sampling
  function imageLuminance(img, sampleSize=8){
    return new Promise((resolve)=>{
      try{
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = sampleSize; const h = sampleSize;
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0,0,w,h).data;
        let r,g,b,lum,sum=0,count=0;
        for(let i=0;i<data.length;i+=4){ r=data[i]; g=data[i+1]; b=data[i+2];
          // standard luminance formula
          lum = 0.2126*r + 0.7152*g + 0.0722*b; sum += lum; count++; }
        resolve(sum / count / 255);
      }catch(e){ resolve(1); }
    })
  }

  // For each .product element, convert its inline <img> into a background and set text color depending on luminance
  async function adaptProductImages(){
    const products = Array.from(document.querySelectorAll('.product'));
    await Promise.all(products.map(async (prod)=>{
      const img = prod.querySelector('img');
      const media = prod.querySelector('.media');
      let src = null;
      if(img){ src = img.currentSrc || img.src || img.getAttribute('data-src'); }
      if(!src){ // try data-image attribute on article
        src = prod.dataset && prod.dataset.image;
      }
      if(src){
        if(media){ media.style.backgroundImage = `url('${src}')`; }
        if(img){ img.style.display = 'none'; }
        // create temp image to sample
        const i = new Image(); i.crossOrigin = 'anonymous'; i.src = src;
        await new Promise((res)=>{ i.onload = res; i.onerror = res });
        const lum = await imageLuminance(i).catch(()=>1);
        const heading = prod.querySelector('h2') || prod.querySelector('.card-title');
        if(heading){
          // if luminance low -> white text; else dark text
          if(lum < 0.55) heading.style.color = '#fff'; else heading.style.color = '#111';
        }
      }
    }))
  }

  // Public init
  window.themeHelpers = {
    init: function(opts){
      applyStoredTheme();
      document.addEventListener('DOMContentLoaded', ()=>{
        // add toggle button if requested
        if(opts && opts.insertToggle){
          const btn = document.createElement('button');
          btn.id = 'theme-toggle';
          btn.className = 'btn btn-outline-secondary';
          btn.style.marginLeft = '12px';
          btn.textContent = document.body.classList.contains('dark-mode')? 'Modo Claro':'Modo Oscuro';
          btn.addEventListener('click', ()=>{ toggleTheme(); btn.textContent = document.body.classList.contains('dark-mode')? 'Modo Claro':'Modo Oscuro'; });
          const target = document.querySelector(opts.insertToggle);
          if(target) target.appendChild(btn);
        }

        // adapt images on load
        adaptProductImages().catch(()=>{});
      });
    },
    toggle: toggleTheme,
    adaptImages: adaptProductImages
  }
})();
