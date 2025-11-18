// supabaseClient.js
// Archivo para conectar tu proyecto web con Supabase
// Asegúrate de colocar este archivo dentro de una carpeta como: /supabase/supabaseClient.js

import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://geymnrkmqdtrboukwzjk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdleW1ucmttcWR0cmJvdWt3emprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDc4ODgsImV4cCI6MjA3ODkyMzg4OH0.6qdpeqQbg2xKEM5VkvxFdkOmaV26uqcbGQMEqkhPJtU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ahora puedes importar "supabase" en cualquier archivo de tu web
// Ejemplo:
// import { supabase } from "../supabase/supabaseClient.js";
