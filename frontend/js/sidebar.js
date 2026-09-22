// ===============================
// sidebar.js
// Control del menú lateral desplegable
// ===============================

$(document).ready(function () {
  // Mostrar / ocultar submenú
  $('.menu-item').on('click', function () {
    $(this).next('.submenu').slideToggle();
  });

  // Navegación de secciones
  $('aside a[data-section]').on('click', function (e) {
    e.preventDefault();
    const section = $(this).data('section');
    $('#content-area > div').hide();

    // Mostrar la vista correspondiente
    if (section === 'general') {
      $('#vista-general').fadeIn(200);
      cargarTecnologias();
    } else if (section === 'incautado') {
      $('#vista-incautado').fadeIn(200);
    } else if (section === 'mantenimiento') {
      $('#vista-mantenimiento').fadeIn(200);
    } else if (section === 'almacenado') {
      $('#vista-almacenado').fadeIn(200);
    } else if (section === 'estatus') {
      $('#vista-estatus').fadeIn(200);
    } else if (section === 'reportes') {
      $('#vista-reportes').fadeIn(200);
    } else {
      $('#placeholder').fadeIn(200);
    }
  });
});
