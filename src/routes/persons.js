import express from 'express';
import Person from '../models/Person.js';

const router = express.Router();

// @route   GET /api/persons
// @desc    Get all persons
// @access  Public
router.get('/', async (req, res) => {
    try {
        const persons = await Person.find()
            .populate('politicalAffiliation.source')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: persons.length,
            data: persons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/persons/:id
// @desc    Get single person by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id)
            .populate('politicalAffiliation.source');

        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found'
            });
        }

        res.json({
            success: true,
            data: person
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   POST /api/persons
// @desc    Create a new person
// @access  Public
router.post('/', async (req, res) => {
    try {
        const person = await Person.create(req.body);

        res.status(201).json({
            success: true,
            data: person
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

// @route   PUT /api/persons/:id
// @desc    Update a person
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const person = await Person.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found'
            });
        }

        res.json({
            success: true,
            data: person
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

// @route   DELETE /api/persons/:id
// @desc    Delete a person
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const person = await Person.findByIdAndDelete(req.params.id);

        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found'
            });
        }

        res.json({
            success: true,
            data: {},
            message: 'Person deleted successfully'
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
