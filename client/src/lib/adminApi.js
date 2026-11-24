// Клієнт адмін-API. Повертає { status, data }; cookie сесії браузер додає сам.
export async function adminFetch(path, { method = 'GET', body } = {}) {
  const response = await fetch('/api/admin' + path, {
    method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}

export const statusLabels = { new: 'Нове', confirmed: 'Підтверджене', shipped: 'Відправлене', done: 'Виконане', cancelled: 'Скасоване' };

// Форма товару <-> тіло запиту
export const emptyProduct = {
  title: '', slug: '', sku: '', categorySlug: '', priceUah: '', oldPriceUah: '', heightCm: '', widthCm: '',
  material: '', inStock: true, colors: '', imageUrls: '', description: '',
};

export const productToForm = p => ({
  title: p.title ?? '', slug: p.slug ?? '', sku: p.sku ?? '', categorySlug: p.categorySlug ?? '',
  priceUah: p.priceUah ?? '', oldPriceUah: p.oldPriceUah ?? '', heightCm: p.heightCm ?? '', widthCm: p.widthCm ?? '',
  material: p.material ?? '', inStock: p.inStock !== false, colors: (p.colors ?? []).join(', '),
  imageUrls: (p.imageUrls ?? []).join('\n'), description: p.description ?? '',
});

export const formToProduct = f => ({
  ...f,
  colors: f.colors.split(',').map(s => s.trim()).filter(Boolean),
  imageUrls: f.imageUrls.split('\n').map(s => s.trim()).filter(Boolean),
});
