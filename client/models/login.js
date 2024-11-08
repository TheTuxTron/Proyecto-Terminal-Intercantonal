// Capturar el evento 'submit' del formulario
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Evitar que el formulario se envíe
  
    const cedula = document.getElementById('cedula').value;
    const contraseña = document.getElementById('contraseña').value;
  
    // Enviar los datos al proceso principal para validar las credenciales
    try {
      const resultado = await window.electronAPI.login(cedula, contraseña);

      localStorage.setItem('loggedUser', resultado.nombre); // Puedes usar otro dato si es más apropiado
      localStorage.setItem('cedulaUser', cedula);

      if (resultado.esAdmin) {
        window.location.href = 'homeAdmin.html';
      } else {
        window.location.href = 'homeUser.html';
      }
    } catch (error) {
      alert(error);
    }
  });