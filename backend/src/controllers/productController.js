const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.number().min(0, 'Le prix doit être positif'),
  tvaRate: z.number().min(0).max(100).default(18),
  category: z.string().optional()
});

// GET /api/products
const getProducts = async (req, res) => {
  const { search = '', page = 1, limit = 20, category } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    organizationId: req.organizationId,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    } : {}),
    ...(category ? { category } : {})
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: parseInt(limit) }),
    prisma.product.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    }
  });
};

// GET /api/products/categories
const getCategories = async (req, res) => {
  const categories = await prisma.product.findMany({
    where: { organizationId: req.organizationId, category: { not: null } },
    select: { category: true },
    distinct: ['category']
  });
  res.json({ success: true, data: { categories: categories.map(c => c.category).filter(Boolean) } });
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId }
  });
  if (!product) throw new AppError('Produit non trouvé', 404);
  res.json({ success: true, data: { product } });
};

// POST /api/products
const createProduct = async (req, res) => {
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({
    data: { ...data, organizationId: req.organizationId }
  });
  res.status(201).json({ success: true, message: 'Produit créé', data: { product } });
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId }
  });
  if (!existing) throw new AppError('Produit non trouvé', 404);

  const data = productSchema.parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Produit mis à jour', data: { product } });
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.organizationId }
  });
  if (!existing) throw new AppError('Produit non trouvé', 404);

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Produit supprimé' });
};

module.exports = { getProducts, getProduct, getCategories, createProduct, updateProduct, deleteProduct };
