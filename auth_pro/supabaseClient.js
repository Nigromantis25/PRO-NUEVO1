// supabaseClient.js - Cliente supabase usado por los módulos de auth (navegador)
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Usa tu Project URL y anon key (ya los tienes en .vscode/supabse/supabase.js)
const SUPABASE_URL = "https://geymnrkmqdtrboukwzjk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdleW1ucmttcWR0cmJvdWt3emprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDc4ODgsImV4cCI6MjA3ODkyMzg4OH0.6qdpeqQbg2xKEM5VkvxFdkOmaV26uqcbGQMEqkhPJtU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
