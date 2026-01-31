import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Case title is required'],
            trim: true
        },
        summary: {
            type: String,
            required: [true, 'Case summary is required'],
            trim: true
        },
        caseStatus: {
            type: String,
            enum: {
                values: ['ALLEGED', 'UNDER_INVESTIGATION', 'CASE_FILED', 'ON_TRIAL', 'CONVICTED', 'ACQUITTED', 'CLOSED'],
                message: '{VALUE} is not a valid case status'
            },
            required: [true, 'Case status is required']
        },
        institution: {
            type: String,
            required: [true, 'Institution is required'],
            trim: true
        },
        location: {
            type: String,
            trim: true
        },
        amountInvolved: {
            type: String,
            trim: true
        },
        dateReported: {
            type: Date,
            required: [true, 'Date reported is required']
        },
        visibility: {
            type: String,
            enum: {
                values: ['DRAFT', 'PUBLISHED'],
                message: '{VALUE} is not a valid visibility status'
            },
            default: 'DRAFT'
        },
        // CIAA-specific fields (optional for backward compatibility)
        category: {
            type: String,
            trim: true
        },
        categoryType: {
            type: String,
            trim: true
        },
        fiscalYear: {
            type: String,
            trim: true
        },
        fiscalYearGregorian: {
            type: String,
            trim: true
        },
        accusedPerson: {
            type: String,
            trim: true
        },
        office: {
            type: String,
            trim: true
        },
        accusation: {
            type: String,
            trim: true
        },
        detailUrl: {
            type: String,
            trim: true
        },
        sourceUrl: {
            type: String,
            trim: true
        },
        dataSource: {
            type: String,
            enum: {
                values: ['CIAA', 'MANUAL'],
                message: '{VALUE} is not a valid data source'
            },
            default: 'MANUAL'
        }
    },
    {
        timestamps: true
    }
);

const Case = mongoose.model('Case', caseSchema);

export default Case;
