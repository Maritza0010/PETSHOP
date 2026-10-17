(() => {
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const mailLink = new URL(link.href);
      const contactUrl = new URL('contacto.html', window.location.href);
      contactUrl.searchParams.set('tema', mailLink.searchParams.get('subject') || 'Consulta general');
      const message = mailLink.searchParams.get('body');
      if (message) contactUrl.searchParams.set('mensaje', message);
      window.location.href = contactUrl.href;
    });
  });

  const form = document.getElementById('formulario-contacto');
  if (!form) return;

  const parameters = new URLSearchParams(window.location.search);
  const topic = parameters.get('tema');
  const message = parameters.get('mensaje');
  if (topic) document.getElementById('contacto-tema').value = topic.slice(0, 120);
  if (message) document.getElementById('contacto-mensaje').value = message.slice(0, 1000);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const lines = [
      'Consulta para Patitas Felices',
      `Nombre: ${values.get('nombre')}`,
      `Correo: ${values.get('correo')}`,
      values.get('telefono') ? `Teléfono: ${values.get('telefono')}` : '',
      `Asunto: ${values.get('tema')}`,
      '',
      String(values.get('mensaje'))
    ].filter(Boolean);
    const whatsappUrl = `https://wa.me/51969672510?text=${encodeURIComponent(lines.join('\n'))}`;
    const whatsappWindow = window.open(whatsappUrl, '_blank');
    const status = document.getElementById('contacto-estado');
    status.hidden = false;

    if (whatsappWindow) {
      whatsappWindow.opener = null;
      status.textContent = 'Se abrió WhatsApp con tu consulta lista para enviar.';
      return;
    }

    status.textContent = 'El navegador bloqueó la ventana. Usa este enlace para abrir WhatsApp: ';
    const fallbackLink = document.createElement('a');
    fallbackLink.href = whatsappUrl;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.textContent = 'Abrir WhatsApp';
    status.append(fallbackLink);
  });
})();