'use strict';

const { Router } = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');

const router = Router();

// Store file in memory so we can pass the buffer to IPFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and image files are allowed'));
  },
});

router.use(auth);

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/property/:propertyId', documentController.getPropertyDocuments);
router.get('/:id', documentController.getDocument);
router.post('/:id/verify', upload.single('file'), documentController.verifyDocument);

module.exports = router;
