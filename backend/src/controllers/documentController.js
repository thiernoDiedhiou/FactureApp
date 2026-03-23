const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');
const { generateDocumentNumber } = require('../utils/documentNumber');
const { calculateDocumentTotals } = require('../utils/formatCFA');

const prisma = new PrismaClient();

const itemSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.number().min(0.01, 'Quantité invalide'),
  unitPrice: z.number().min(0, 'Prix invalide'),
  tvaRate: z.number().min(0).max(100).default(18)
});

const documentSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  type: z.enum(['facture', 'devis', 'proforma']),
  status: z.enum(['en_attente', 'paye', 'annule']).default('en_attente'),
  issuedDate: z.string().min(1, 'Date d\'émission requise'),
  dueDate: z.string().optional().nullable(),
  discount: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins une ligne est requise')
});

const include = {
  client: true,
  items: { include: { product: true } },
  emailLogs: { orderBy: { sentAt: 'desc' } }
};

// GET /api/documents
const getDocuments = async (req, res) => {
  const {
    search = '', page = 1, limit = 10,
    type, status, clientId,
    dateFrom, dateTo
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    userId: req.user.id,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search ? {
      OR: [
        { number: { contains: search } },
        { client: { name: { contains: search } } },
        { notes: { contains: search } }
      ]
    } : {}),
    ...(dateFrom || dateTo ? {
      issuedDate: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {})
      }
    } : {})
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: { client: { select: { id: true, name: true, companyName: true } } }
    }),
    prisma.document.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

// GET /api/documents/:id
const getDocument = async (req, res) => {
  const document = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include
  });
  if (!document) throw new AppError('Document non trouvé', 404);
  res.json({ success: true, data: { document } });
};

// POST /api/documents
const createDocument = async (req, res) => {
  const data = documentSchema.parse(req.body);

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId: req.user.id }
  });
  if (!client) throw new AppError('Client non trouvé', 404);

  const number = await generateDocumentNumber(data.type, req.user.id);
  const { items, totalHt, totalTva, totalTtc } = calculateDocumentTotals(
    data.items, data.discount
  );

  const document = await prisma.document.create({
    data: {
      userId: req.user.id,
      clientId: data.clientId,
      type: data.type,
      number,
      status: data.status,
      totalHt,
      totalTva,
      totalTtc,
      discount: data.discount,
      issuedDate: new Date(data.issuedDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes,
      items: {
        create: items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tvaRate: item.tvaRate,
          subtotal: item.subtotal
        }))
      }
    },
    include
  });

  res.status(201).json({ success: true, message: 'Document créé', data: { document } });
};

// PUT /api/documents/:id
const updateDocument = async (req, res) => {
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!existing) throw new AppError('Document non trouvé', 404);
  if (existing.status === 'paye') {
    throw new AppError('Impossible de modifier un document payé', 400);
  }

  const data = documentSchema.parse(req.body);
  const { items, totalHt, totalTva, totalTtc } = calculateDocumentTotals(
    data.items, data.discount
  );

  await prisma.documentItem.deleteMany({ where: { documentId: req.params.id } });

  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: {
      clientId: data.clientId,
      status: data.status,
      totalHt,
      totalTva,
      totalTtc,
      discount: data.discount,
      issuedDate: new Date(data.issuedDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes,
      items: {
        create: items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tvaRate: item.tvaRate,
          subtotal: item.subtotal
        }))
      }
    },
    include
  });

  res.json({ success: true, message: 'Document mis à jour', data: { document } });
};

// PATCH /api/documents/:id/status
const updateStatus = async (req, res) => {
  const schema = z.object({
    status: z.enum(['en_attente', 'paye', 'annule']),
    paidAt: z.string().optional()
  });

  const { status, paidAt } = schema.parse(req.body);
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!existing) throw new AppError('Document non trouvé', 404);

  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: {
      status,
      paidAt: status === 'paye' ? (paidAt ? new Date(paidAt) : new Date()) : null
    },
    include: { client: true }
  });

  res.json({ success: true, message: 'Statut mis à jour', data: { document } });
};

// POST /api/documents/:id/convert
const convertDocument = async (req, res) => {
  const schema = z.object({
    type: z.enum(['facture', 'devis', 'proforma'])
  });
  const { type } = schema.parse(req.body);

  const original = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: true }
  });
  if (!original) throw new AppError('Document non trouvé', 404);

  const number = await generateDocumentNumber(type, req.user.id);

  const document = await prisma.document.create({
    data: {
      userId: req.user.id,
      clientId: original.clientId,
      type,
      number,
      status: 'en_attente',
      totalHt: original.totalHt,
      totalTva: original.totalTva,
      totalTtc: original.totalTtc,
      discount: original.discount,
      issuedDate: new Date(),
      dueDate: original.dueDate,
      notes: original.notes,
      originalId: original.id,
      items: {
        create: original.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tvaRate: item.tvaRate,
          subtotal: item.subtotal
        }))
      }
    },
    include
  });

  res.status(201).json({
    success: true,
    message: `Document converti en ${type}`,
    data: { document }
  });
};

// POST /api/documents/:id/duplicate
const duplicateDocument = async (req, res) => {
  const original = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: true }
  });
  if (!original) throw new AppError('Document non trouvé', 404);

  const number = await generateDocumentNumber(original.type, req.user.id);

  const document = await prisma.document.create({
    data: {
      userId: req.user.id,
      clientId: original.clientId,
      type: original.type,
      number,
      status: 'en_attente',
      totalHt: original.totalHt,
      totalTva: original.totalTva,
      totalTtc: original.totalTtc,
      discount: original.discount,
      issuedDate: new Date(),
      dueDate: original.dueDate,
      notes: original.notes,
      items: {
        create: original.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tvaRate: item.tvaRate,
          subtotal: item.subtotal
        }))
      }
    },
    include
  });

  res.status(201).json({ success: true, message: 'Document dupliqué', data: { document } });
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!existing) throw new AppError('Document non trouvé', 404);

  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Document supprimé' });
};

module.exports = {
  getDocuments, getDocument, createDocument, updateDocument,
  updateStatus, convertDocument, duplicateDocument, deleteDocument
};
