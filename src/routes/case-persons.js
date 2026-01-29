import express from 'express';
import CasePerson from '../models/CasePerson.js';

const router = express.Router();

// @route   POST /api/case-persons
// @desc    Create a relationship between a Case and a Person
// @access  Public
router.post('/', async (req, res) => {
    try {
        const casePerson = await CasePerson.create(req.body);

        // Populate references for the response
        await casePerson.populate(['case', 'person', 'source']);

        res.status(201).json({
            success: true,
            data: casePerson
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

// @route   GET /api/case-persons
// @desc    Get all case-person relationships
// @access  Public
router.get('/', async (req, res) => {
    try {
        const casePersons = await CasePerson.find()
            .populate('case')
            .populate('person')
            .populate('source')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: casePersons.length,
            data: casePersons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/case-persons/case/:caseId
// @desc    Get all persons linked to a specific case
// @access  Public
router.get('/case/:caseId', async (req, res) => {
    try {
        const casePersons = await CasePerson.find({ case: req.params.caseId })
            .populate('person')
            .populate('source')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: casePersons.length,
            data: casePersons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/case-persons/person/:personId
// @desc    Get all cases linked to a specific person
// @access  Public
router.get('/person/:personId', async (req, res) => {
    try {
        const casePersons = await CasePerson.find({ person: req.params.personId })
            .populate('case')
            .populate('source')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: casePersons.length,
            data: casePersons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/case-persons/:id
// @desc    Get single case-person relationship by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const casePerson = await CasePerson.findById(req.params.id)
            .populate('case')
            .populate('person')
            .populate('source');

        if (!casePerson) {
            return res.status(404).json({
                success: false,
                error: 'Case-Person relationship not found'
            });
        }

        res.json({
            success: true,
            data: casePerson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   PUT /api/case-persons/:id
// @desc    Update a case-person relationship
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const casePerson = await CasePerson.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        )
            .populate('case')
            .populate('person')
            .populate('source');

        if (!casePerson) {
            return res.status(404).json({
                success: false,
                error: 'Case-Person relationship not found'
            });
        }

        res.json({
            success: true,
            data: casePerson
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

// @route   DELETE /api/case-persons/:id
// @desc    Delete a case-person relationship
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const casePerson = await CasePerson.findByIdAndDelete(req.params.id);

        if (!casePerson) {
            return res.status(404).json({
                success: false,
                error: 'Case-Person relationship not found'
            });
        }

        res.json({
            success: true,
            data: {},
            message: 'Case-Person relationship deleted successfully'
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
