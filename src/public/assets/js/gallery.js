(() => {
  'use strict';

  const { connectDialog, escapeHTML, icon, media } = globalThis.millinghouse['common'];

  function caption(image, index) {
    return image.caption ?? (image.detail ? 'Деталь різьблення' : index === 0 ? 'Загальний вигляд' : 'Зображення ' + (index + 1));
  }

  function lightboxHTML(images, title) {
    return '<dialog class="lightbox" id="gallery-dialog" aria-labelledby="gallery-title">' +
        '<div class="lightbox__header"><h2 id="gallery-title">' + escapeHTML(title) + '</h2>' +
        '<button class="icon-button" type="button" data-close autofocus aria-label="Закрити галерею">' + icon('close') + '</button></div>' +
        '<div class="lightbox__image"></div>' +
        (images.length > 1 ? '<div class="lightbox__controls">' +
          '<button class="icon-button" type="button" data-previous aria-label="Попереднє зображення">' + icon('arrow icon-back') + '</button>' +
          '<output></output><button class="icon-button" type="button" data-next aria-label="Наступне зображення">' +
          icon('arrow') + '</button></div>' : '') + '</dialog>';
  }

  function galleryHTML(images, title) {
    if (!images.length) return '';

    return '<section class="gallery" aria-label="Галерея зображень" style="--gallery-ratio:' + (images[0].width / images[0].height) + '">' +
      '<button type="button" class="gallery-stage" data-zoom aria-haspopup="dialog" aria-controls="gallery-dialog"></button>' +
      (images.length > 1 ? '<div class="gallery-strip" role="group" aria-label="Вибір зображення">' +
        images.map((image, index) => '<button type="button" class="gallery-thumb" data-index="' + index +
          '" aria-label="' + escapeHTML(caption(image, index)) + '" aria-pressed="false">' +
          media(image, { sizes: '77px' }) + '</button>').join('') + '</div>' : '') +
      '<p class="gallery-caption" role="status"></p>' + lightboxHTML(images, title) + '</section>';
  }

  function photoGridHTML(images, title) {
    if (!images.length) return '';
    return images.map((image, index) =>
      '<figure><button class="photo-tile" type="button" data-photo="' + index + '" aria-haspopup="dialog" aria-controls="gallery-dialog"' +
        ' aria-label="Збільшити зображення. ' + escapeHTML(image.alt) + '">' +
        media(image, { sizes: images.length === 3 && index === 0
          ? '(max-width: 850px) 90vw, 60vw'
          : '(max-width: 850px) 45vw, 30vw' }) +
        '<span class="gallery-zoom">' + icon('zoom') + '</span></button>' +
        (image.caption ? '<figcaption class="figure-caption">' + escapeHTML(image.caption) + '</figcaption>' : '') + '</figure>'
    ).join('') + lightboxHTML(images, title);
  }

  function initializeLightbox(dialog, images) {
    const output = dialog.querySelector('output');
    const imageArea = dialog.querySelector('.lightbox__image');
    let current = 0;

    function show(index) {
      current = (index + images.length) % images.length;
      const image = images[current];
      dialog.style.setProperty('--gallery-ratio', image.width / image.height);
      imageArea.innerHTML = media(image, { eager: true, full: true });
      if (output) output.textContent = caption(image, current) + ' · ' + (current + 1) + ' з ' + images.length;
    }

    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    if (images.length > 1) {
      dialog.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
      dialog.querySelector('[data-previous]').addEventListener('click', () => show(current - 1));
      dialog.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        show(current + (event.key === 'ArrowRight' ? 1 : -1));
      });
    }
    return show;
  }

  function initializeGallery(gallery, images) {
    if (!images.length) return;
    const stage = gallery.querySelector('[data-zoom]');
    const currentCaption = gallery.querySelector('.gallery-caption');
    const thumbs = [...gallery.querySelectorAll('[data-index]')];
    const dialog = gallery.querySelector('dialog');
    const show = initializeLightbox(dialog, images);
    let current = 0;

    function select(index) {
      current = (index + images.length) % images.length;
      const image = images[current];
      const label = caption(image, current);
      const description = label + (images.length > 1 ? ' · ' + (current + 1) + ' з ' + images.length : '');
      gallery.style.setProperty('--gallery-ratio', image.width / image.height);
      stage.innerHTML = media(image, { eager: true, sizes: '(max-width: 700px) 90vw, 52vw' }) +
        '<span class="gallery-zoom">' + icon('zoom') + '</span>';
      stage.setAttribute('aria-label', 'Збільшити зображення. ' + label);
      currentCaption.textContent = description;
      thumbs.forEach((thumb, index) => thumb.setAttribute('aria-pressed', String(index === current)));
    }

    stage.addEventListener('click', () => show(current));
    connectDialog(dialog, stage);

    if (images.length > 1) {
      thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => select(index)));
      gallery.addEventListener('keydown', event => {
        if (dialog.open) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const thumbHasFocus = thumbs.includes(document.activeElement);
        select(current + (event.key === 'ArrowRight' ? 1 : -1));
        if (thumbHasFocus) thumbs[current].focus();
      });
    }
    select(0);
  }

  function initializePhotoGrid(grid, images) {
    if (!images.length) return;
    const dialog = grid.querySelector('dialog');
    const show = initializeLightbox(dialog, images);
    connectDialog(dialog, null);
    grid.querySelectorAll('[data-photo]').forEach(button => {
      button.addEventListener('click', () => {
        show(Number(button.dataset.photo));
        dialog.showModal();
      });
    });
  }

  globalThis.millinghouse['gallery'] = {
    galleryHTML,
    photoGridHTML,
    initializeGallery,
    initializePhotoGrid,
  };
})();
