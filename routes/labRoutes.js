const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); 
const {
    addLab,
    getAllLabs,
    getLabById,
    updateLab,
    deleteLab,
    addLabTests
} = require('../controllers/labController');

// Routes - all protected with authentication
router.post('/', upload.single('tests'),  addLabTests);
// router.get('/', getAllLabs);
// router.get('/:id', getLabById);
// router.put('/:id', updateLab);
// router.delete('/:id', protect, deleteLab);

module.exports = router; 