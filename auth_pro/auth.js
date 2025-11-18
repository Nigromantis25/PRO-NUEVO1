import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if(!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value || 'user';

    if(!email || !password || !fullname){
      alert('Por favor completa todos los campos.');
      return;
    }

    try{
      // Usando Supabase v2: signUp({email, password, options: { data }})
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullname, role } }
      });

      if(error){
        console.error('Supabase signUp error', error);
        alert('Error al crear la cuenta: ' + (error.message || error.toString()));
        return;
      }

      // Si en Supabase está activado el email confirmation, data.user será null y se envía correo.
      alert('Cuenta creada. Revisa tu correo para confirmar (si tu Supabase requiere verificación).');
      // Redirigir al login (local)
      window.location.href = '/auth_pro/login.html';
    }catch(err){
      console.error(err);
      alert('Ocurrió un error inesperado. Revisa la consola.');
    }
  });
});
