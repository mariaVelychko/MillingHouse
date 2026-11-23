export default function Media({ image, eager = false, sizes = '100vw', full = false, detail = true }) {
  if (!image) return null;
  const view = detail ? image.detail : null;
  const srcSet = image.small && !full ? `${image.small} 640w, ${image.src} ${image.width}w` : undefined;
  const style = view ? { '--media-scale': view.scale, '--media-position': view.position } : undefined;
  return (
    <span className={'media' + (view ? ' media--detail' : '')} style={style}>
      <img src={image.src} srcSet={srcSet} sizes={srcSet ? sizes : undefined} width={image.width} height={image.height}
        alt={image.alt} decoding="async" loading={eager ? 'eager' : 'lazy'} />
    </span>
  );
}

export function FigureImage({ image, ...options }) {
  if (!image) return null;
  return (
    <>
      <div className="editorial-frame" style={{ '--frame-ratio': image.width / image.height }}>
        <Media image={image} {...options} />
      </div>
      {image.caption && <figcaption className="figure-caption">{image.caption}</figcaption>}
    </>
  );
}
