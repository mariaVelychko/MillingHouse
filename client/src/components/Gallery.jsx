import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import Media from './Media.jsx';

export function caption(image, index) {
  return image.caption ?? (image.detail ? 'Деталь різьблення' : index === 0 ? 'Загальний вигляд' : 'Зображення ' + (index + 1));
}

const openDialog = dialog => (dialog.showModal ? dialog.showModal() : dialog.setAttribute('open', ''));
const closeDialog = dialog => (dialog.close ? dialog.close() : dialog.removeAttribute('open'));

function Lightbox({ images, title, dialogRef, index, setIndex }) {
  const image = images[index];
  const step = delta => setIndex((index + delta + images.length) % images.length);
  const onKeyDown = event => {
    if (images.length < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  };
  return (
    <dialog className="lightbox" id="gallery-dialog" aria-labelledby="gallery-title" ref={dialogRef}
      style={{ '--gallery-ratio': image.width / image.height }} onKeyDown={onKeyDown}
      onClick={event => { if (event.target === dialogRef.current) closeDialog(dialogRef.current); }}>
      <div className="lightbox__header">
        <h2 id="gallery-title">{title}</h2>
        <button className="icon-button" type="button" autoFocus aria-label="Закрити галерею" onClick={() => closeDialog(dialogRef.current)}>
          <Icon name="close" />
        </button>
      </div>
      <div className="lightbox__image"><Media image={image} eager full /></div>
      {images.length > 1 && (
        <div className="lightbox__controls">
          <button className="icon-button" type="button" aria-label="Попереднє зображення" onClick={() => step(-1)}><Icon name="arrow icon-back" /></button>
          <output>{caption(image, index)} · {index + 1} з {images.length}</output>
          <button className="icon-button" type="button" aria-label="Наступне зображення" onClick={() => step(1)}><Icon name="arrow" /></button>
        </div>
      )}
    </dialog>
  );
}

// Головна галерея сторінки товару: велике фото, мініатюри, збільшення
export function Gallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef(null);
  useEffect(() => setIndex(0), [images]);
  if (!images.length) return null;
  const image = images[index] ?? images[0];
  const label = caption(image, index);
  const select = next => setIndex((next + images.length) % images.length);
  const onKeyDown = event => {
    if (images.length < 2 || dialogRef.current?.open) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    select(index + (event.key === 'ArrowRight' ? 1 : -1));
  };
  return (
    <section className="gallery" aria-label="Галерея зображень" style={{ '--gallery-ratio': image.width / image.height }} onKeyDown={onKeyDown}>
      <button type="button" className="gallery-stage" aria-haspopup="dialog" aria-controls="gallery-dialog"
        aria-label={'Збільшити зображення. ' + label} onClick={() => openDialog(dialogRef.current)}>
        <Media image={image} eager sizes="(max-width: 700px) 90vw, 52vw" />
        <span className="gallery-zoom"><Icon name="zoom" /></span>
      </button>
      {images.length > 1 && (
        <div className="gallery-strip" role="group" aria-label="Вибір зображення">
          {images.map((item, i) => (
            <button key={item.src + i} type="button" className="gallery-thumb" aria-label={caption(item, i)}
              aria-pressed={i === index} onClick={() => select(i)}>
              <Media image={item} sizes="77px" />
            </button>
          ))}
        </div>
      )}
      <p className="gallery-caption" role="status">{label}{images.length > 1 ? ` · ${index + 1} з ${images.length}` : ''}</p>
      <Lightbox images={images} title={title} dialogRef={dialogRef} index={index} setIndex={setIndex} />
    </section>
  );
}

// Сітка фото (сторінка «Про нас») із загальним збільшенням
export function PhotoGrid({ images, title }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef(null);
  if (!images.length) return null;
  return (
    <>
      {images.map((image, i) => (
        <figure key={image.src + i}>
          <button className="photo-tile" type="button" aria-haspopup="dialog" aria-controls="gallery-dialog"
            aria-label={'Збільшити зображення. ' + image.alt}
            onClick={() => { setIndex(i); openDialog(dialogRef.current); }}>
            <Media image={image} sizes={images.length === 3 && i === 0 ? '(max-width: 850px) 90vw, 60vw' : '(max-width: 850px) 45vw, 30vw'} />
            <span className="gallery-zoom"><Icon name="zoom" /></span>
          </button>
          {image.caption && <figcaption className="figure-caption">{image.caption}</figcaption>}
        </figure>
      ))}
      <Lightbox images={images} title={title} dialogRef={dialogRef} index={index} setIndex={setIndex} />
    </>
  );
}
