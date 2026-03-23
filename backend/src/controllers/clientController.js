const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { AppError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

const clientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  companyName: z.string().optional(),
  ninea: z.string().optional()
});

// GET /api/clients
const getClients = async (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    userId: req.user.id,
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    } : {})
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        _count: { select: { documents: true } }
      }
    }),
    prisma.client.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

// GET /api/clients/:id
const getClient = async (req, res) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, number: true, type: true, status: true,
          totalTtc: true, issuedDate: true, dueDate: true
        }
      },
      _count: { select: { documents: true } }
    }
  });

  if (!client) throw new AppError('Client non trouvé', 404);

  res.json({ success: true, data: { client } });
};

// POST /api/clients
const createClient = async (req, res) => {
  const data = clientSchema.parse(req.body);
  const client = await prisma.client.create({
    data: { ...data, userId: req.user.id }
  });
  res.status(201).json({ success: true, message: 'Client créé', data: { client } });
};

// PUT /api/clients/:id
const updateClient = async (req, res) => {
  const existing = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!existing) throw new AppError('Client non trouvé', 404);

  const data = clientSchema.parse(req.body);
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data
  });
  res.json({ success: true, message: 'Client mis à jour', data: { client } });
};

// DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  const existing = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!existing) throw new AppError('Client non trouvé', 404);

  const docCount = await prisma.document.count({
    where: { clientId: req.params.id }
  });

  if (docCount > 0) {
    throw new AppError(
      `Impossible de supprimer ce client : ${docCount} document(s) lié(s)`,
      400
    );
  }

  await prisma.client.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Client supprimé' });
};

// POST /api/clients/import-csv
const importCSV = async (req, res) => {
  if (!req.file) throw new AppError('Fichier CSV requis', 400);

  const { parse } = require('csv-parse/sync');
  const content = req.file.buffer.toString('utf-8');

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const imported = [];
  const errors = [];

  for (const [index, record] of records.entries()) {
    try {
      const client = await prisma.client.create({
        data: {
          userId: req.user.id,
          name: record.name || record.nom || '',
          email: record.email || null,
          phone: record.phone || record.telephone || null,
          address: record.address || record.adresse || null,
          companyName: record.company || record.entreprise || null,
          ninea: record.ninea || null
        }
      });
      imported.push(client);
    } catch (err) {
      errors.push({ ligne: index + 2, erreur: err.message });
    }
  }

  res.json({
    success: true,
    message: `${imported.length} client(s) importé(s)`,
    data: { imported: imported.length, errors }
  });
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient, importCSV };
