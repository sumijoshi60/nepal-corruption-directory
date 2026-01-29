import express from 'express';
import Case from '../models/Case.js';
import CasePerson from '../models/CasePerson.js';

const router = express.Router();

// @route   GET /api/public/cases
// @desc    Get all published cases with optional filtering and search (public access)
// @access  Public
// @query   ?location=string&role=ACCUSED|INVESTIGATOR|WITNESS&politicalParty=string&year=number&search=string
router.get('/cases', async (req, res) => {
    try {
        const { location, role, politicalParty, year, search, page, limit } = req.query;

        // Pagination parameters with defaults
        const currentPage = parseInt(page) || 1;
        const itemsPerPage = parseInt(limit) || 10;
        const skip = (currentPage - 1) * itemsPerPage;

        // Determine if we need $lookup stages (person-related filters only)
        const needsPersonLookup = role || politicalParty || search;

        if (needsPersonLookup) {
            // Use aggregation pipeline for complex queries
            const pipeline = [];

            // Stage 1: Match published cases with case-level filters BEFORE $lookup
            const matchStage = { visibility: 'PUBLISHED' };

            // Add location filter if provided
            if (location) {
                matchStage.location = { $regex: new RegExp(location, 'i') };
            }

            // Add year filter if provided
            if (year) {
                const yearNum = parseInt(year);
                if (!isNaN(yearNum)) {
                    const startDate = new Date(yearNum, 0, 1);
                    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);
                    matchStage.dateReported = { $gte: startDate, $lte: endDate };
                }
            }

            // Add case text search using $text index BEFORE $lookup
            if (search) {
                matchStage.$text = { $search: search };
            }

            pipeline.push({ $match: matchStage });

            // Stage 2: Lookup case-person relationships (only after case-level filtering)
            pipeline.push({
                $lookup: {
                    from: 'casepersons',
                    localField: '_id',
                    foreignField: 'case',
                    as: 'casePersons'
                }
            });

            // Stage 3: Lookup person details
            pipeline.push({
                $lookup: {
                    from: 'people',
                    localField: 'casePersons.person',
                    foreignField: '_id',
                    as: 'persons'
                }
            });

            // Stage 4: Filter based on person-related criteria
            const filterConditions = [];

            if (role) {
                filterConditions.push({
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: '$casePersons',
                                    as: 'cp',
                                    cond: { $eq: ['$$cp.roleInCase', role.toUpperCase()] }
                                }
                            }
                        },
                        0
                    ]
                });
            }

            if (politicalParty) {
                filterConditions.push({
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: '$persons',
                                    as: 'p',
                                    cond: {
                                        $regexMatch: {
                                            input: { $ifNull: ['$$p.politicalAffiliation.partyName', ''] },
                                            regex: politicalParty,
                                            options: 'i'
                                        }
                                    }
                                }
                            }
                        },
                        0
                    ]
                });
            }

            // Person name search using regex (after $lookup)
            if (search) {
                filterConditions.push({
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: '$persons',
                                    as: 'p',
                                    cond: {
                                        $regexMatch: {
                                            input: { $ifNull: ['$$p.fullName', ''] },
                                            regex: search,
                                            options: 'i'
                                        }
                                    }
                                }
                            }
                        },
                        0
                    ]
                });
            }

            if (filterConditions.length > 0) {
                pipeline.push({
                    $match: {
                        $expr: {
                            $or: filterConditions
                        }
                    }
                });
            }

            // Stage 5: Remove the joined fields and __v
            pipeline.push({
                $project: {
                    casePersons: 0,
                    persons: 0,
                    __v: 0
                }
            });

            // Stage 6: Sort by dateReported descending
            pipeline.push({ $sort: { dateReported: -1 } });

            // Stage 7: Use $facet to get both data and total count
            pipeline.push({
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: itemsPerPage }]
                }
            });

            const result = await Case.aggregate(pipeline);
            const cases = result[0]?.data || [];
            const total = result[0]?.metadata[0]?.total || 0;
            const totalPages = Math.ceil(total / itemsPerPage);

            res.json({
                success: true,
                count: cases.length,
                total,
                page: currentPage,
                limit: itemsPerPage,
                totalPages,
                data: cases
            });
        } else {
            // Simple query without joins for better performance
            const filter = { visibility: 'PUBLISHED' };

            // Add location filter if provided
            if (location) {
                filter.location = { $regex: new RegExp(location, 'i') };
            }

            // Add year filter if provided
            if (year) {
                const yearNum = parseInt(year);
                if (!isNaN(yearNum)) {
                    const startDate = new Date(yearNum, 0, 1);
                    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);
                    filter.dateReported = { $gte: startDate, $lte: endDate };
                }
            }

            // Get total count for pagination
            const total = await Case.countDocuments(filter);
            const totalPages = Math.ceil(total / itemsPerPage);

            const cases = await Case.find(filter)
                .select('-__v')
                .sort({ dateReported: -1 })
                .skip(skip)
                .limit(itemsPerPage)
                .lean();

            res.json({
                success: true,
                count: cases.length,
                total,
                page: currentPage,
                limit: itemsPerPage,
                totalPages,
                data: cases
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
});

// @route   GET /api/public/cases/:id
// @desc    Get single published case with linked persons (grouped by role)
// @access  Public
router.get('/cases/:id', async (req, res) => {
    try {
        // First, verify the case exists and is PUBLISHED
        const caseItem = await Case.findOne({
            _id: req.params.id,
            visibility: 'PUBLISHED'
        }).lean();

        if (!caseItem) {
            return res.status(404).json({
                success: false,
                error: 'Case not found or not published'
            });
        }

        // Remove internal fields
        delete caseItem.__v;

        // Get all persons linked to this case with their relationships
        const casePersons = await CasePerson.find({ case: req.params.id })
            .populate('person')
            .populate('source')
            .lean();

        // Group persons by their role in the case
        const groupedPersons = {
            accused: [],
            investigators: [],
            witnesses: []
        };

        casePersons.forEach(cp => {
            if (!cp.person) return; // Skip if person not found

            const personData = {
                fullName: cp.person.fullName,
                position: cp.person.position,
                organization: cp.person.organization,
                politicalAffiliation: cp.person.politicalAffiliation,
                statusLabel: cp.statusLabel,
                source: cp.source ? {
                    type: cp.source.type,
                    publisher: cp.source.publisher,
                    url: cp.source.url,
                    publishedDate: cp.source.publishedDate,
                    language: cp.source.language
                } : null
            };

            switch (cp.roleInCase) {
                case 'ACCUSED':
                    groupedPersons.accused.push(personData);
                    break;
                case 'INVESTIGATOR':
                    groupedPersons.investigators.push(personData);
                    break;
                case 'WITNESS':
                    groupedPersons.witnesses.push(personData);
                    break;
            }
        });

        res.json({
            success: true,
            data: {
                ...caseItem,
                relatedPersons: groupedPersons
            }
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
