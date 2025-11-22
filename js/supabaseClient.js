// Supabase client para el navegador (UMD build debe estar cargado antes)
(function(){
  // Sustituye estas constantes si quieres usar otro project
  const SUPABASE_URL = "https://geymnrkmqdtrboukwzjk.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdleW1ucmttcWR0cmJvdWt3emprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDc4ODgsImV4cCI6MjA3ODkyMzg4OH0.6qdpeqQbg2xKEM5VkvxFdkOmaV26uqcbGQMEqkhPJtU";
  if(typeof supabase === 'undefined'){
    console.warn('Supabase UMD not found. Include @supabase/supabase-js script before this file to enable remote stock.');
    return;
  }
  try{
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }catch(e){ console.warn('Error creating supabase client', e); }
})();
