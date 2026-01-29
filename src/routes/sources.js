import express from 'express';
import Source from '../models/Source.js';

const router = express.Router();

// @route   GET /api/sources
// @desc    Get all sources
// @access  Public
router.get('/', async (req, res) => {
    try {
        const sources = await Source.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: sources.length,
            data: sources
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/sources/:id
// @desc    Get single source by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const source = await Source.findById(req.params.id);

        if (!source) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        res.json({
            success: true,
            data: source
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   POST /api/sources
// @desc    Create a new source
// @access  Public
router.post('/', async (req, res) => {
    try {
        const source = await Source.create(req.body);

        res.status(201).json({
            success: true,
            data: source
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

// @route   PUT /api/sources/:id
// @desc    Update a source
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const source = await Source.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!source) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        res.json({
            success: true,
            data: source
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

// @route   DELETE /api/sources/:id
// @desc    Delete a source
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const source = await Source.findByIdAndDelete(req.params.id);

        if (!source) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        res.json({
            success: true,
            data: {},
            message: 'Source deleted successfully'
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
