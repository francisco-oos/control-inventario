// ===============================
// tabs.js
// Control de los tabs "Tecnologías" y "Nodos"
// ===============================
$(document).on('click', '.tab-link', async function (e) {
  e.preventDefault();
  const tabId = $(this).data('tab');

  $('.tab-link').removeClass('active');
  $(this).addClass('active');

  $('.content').removeClass('active');
  $('#' + tabId).addClass('active');

  // Si el usuario abre Nodos, cargar listado
  if (tabId === 'nodos') {
    await cargarNodos();
  }
});
