import sprite from './sprite.svg?raw';

// SVG-символи іконок, на які посилаються <use href="#line-icon-...">
export default function Sprite() {
  return <div dangerouslySetInnerHTML={{ __html: sprite }} />;
}
