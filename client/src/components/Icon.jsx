export function Icon({ name }) {
  return <span className={'icon icon-' + name} aria-hidden="true" />;
}

export function LineIcon({ name, className = 'line-icon' }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use href={'#line-icon-' + name} />
    </svg>
  );
}
