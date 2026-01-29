import express from 'express';
import Case from '../models/Case.js';

const router = express.Router();

// @route   GET /api/cases
// @desc    Get all published cases
// @access  Public
router.get('/', async (req, res) => {
    try {
        const cases = await Case.find({ visibility: 'PUBLISHED' }).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: cases.length,
            data: cases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/cases/:id
// @desc    Get single case by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id);

        if (!caseItem) {
            return res.status(404).json({
                success: false,
                error: 'Case not found'
            });
        }

        res.json({
            success: true,
            data: caseItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   POST /api/cases
// @desc    Create a new case
// @access  Public
router.post('/', async (req, res) => {
    try {
        const caseItem = await Case.create(req.body);

        res.status(201).json({
            success: true,
            data: caseItem
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                messages
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   PUT /api/cases/:id
// @desc    Update a case
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const caseItem = await Case.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!caseItem) {
            return res.status(404).json({
                success: false,
                error: 'Case not found'
            });
        }

        res.json({
            success: true,
            data: caseItem
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                messages
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   DELETE /api/cases/:id
// @desc    Delete a case
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const caseItem = await Case.findByIdAndDelete(req.params.id);

        if (!caseItem) {
            return res.status(404).json({
                success: false,
                error: 'Case not found'
            });
        }

        res.json({
            success: true,
            data: {},
            message: 'Case deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

export default router;
