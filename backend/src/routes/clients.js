const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, requireOrganization } = require('../middlewares/auth');
const {
  getClients, getClient, createClient, updateClient, deleteClient, importCSV
} = require('../controllers/clientController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(requireOrganization);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/import/csv', upload.single('file'), importCSV);

module.exports = router;
