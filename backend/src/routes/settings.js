const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middlewares/auth');
const {
  getSettings, updateSettings, uploadLogo, uploadSignature,
  deleteLogo, deleteSignature
} = require('../controllers/settingsController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format non autorisé. Utilisez JPG, PNG ou SVG.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

router.use(authenticate);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/logo', upload.single('logo'), uploadLogo);
router.post('/signature', upload.single('signature'), uploadSignature);
router.delete('/logo', deleteLogo);
router.delete('/signature', deleteSignature);

module.exports = router;
