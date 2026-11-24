const prisma = require('../lib/prisma');
const { validateProductInput, validateStatus } = require('./adminLogic');

const productInclude = { images: { orderBy: { position: 'asc' } } };

// Помилки Prisma -> зрозумілі помилки полів
function mapPrismaError(error) {
  if (error.code === 'P2002') {
    const target = String(error.meta?.target ?? '');
    return { errors: { [target.includes('sku') ? 'sku' : 'slug']: 'Таке значення вже існує.' } };
  }
  if (error.code === 'P2003') return { errors: { categorySlug: 'Такої категорії немає.' } };
  throw error;
}

const toData = ({ imageUrls, ...rest }) => ({ ...rest, images: { create: imageUrls.map((url, position) => ({ url, position })) } });

module.exports = {
  listOrders: () => prisma.order.findMany({ orderBy: { id: 'desc' }, include: { items: true } }),

  async setOrderStatus(number, status) {
    if (!validateStatus(status)) return { errors: { status: 'Невідомий статус.' } };
    try { return { order: await prisma.order.update({ where: { number }, data: { status }, include: { items: true } }) }; }
    catch (error) { if (error.code === 'P2025') return { notFound: true }; throw error; }
  },

  listCategories: () => prisma.category.findMany({ orderBy: { slug: 'asc' } }),
  listProducts: () => prisma.product.findMany({ orderBy: { id: 'desc' }, include: productInclude }),
  getProduct: id => prisma.product.findUnique({ where: { id }, include: productInclude }),

  async createProduct(body) {
    const { errors, value } = validateProductInput(body);
    if (Object.keys(errors).length) return { errors };
    try { return { product: await prisma.product.create({ data: toData(value), include: productInclude }) }; }
    catch (error) { return mapPrismaError(error); }
  },

  async updateProduct(id, body) {
    const { errors, value } = validateProductInput(body);
    if (Object.keys(errors).length) return { errors };
    const { images, ...data } = toData(value);
    try {
      const product = await prisma.$transaction(async tx => {
        await tx.productImage.deleteMany({ where: { productId: id } });
        return tx.product.update({ where: { id }, data: { ...data, images }, include: productInclude });
      });
      return { product };
    } catch (error) {
      if (error.code === 'P2025') return { notFound: true };
      return mapPrismaError(error);
    }
  },

  async deleteProduct(id) {
    try { await prisma.product.delete({ where: { id } }); return { ok: true }; }
    catch (error) { if (error.code === 'P2025') return { notFound: true }; throw error; }
  },
};
