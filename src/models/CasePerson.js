import mongoose from 'mongoose';

const casePersonSchema = new mongoose.Schema(
    {
        case: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Case',
            required: [true, 'Case reference is required']
        },
        person: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Person',
            required: [true, 'Person reference is required']
        },
        roleInCase: {
            type: String,
            enum: {
                values: ['ACCUSED', 'INVESTIGATOR', 'WITNESS'],
                message: '{VALUE} is not a valid role in case'
            },
            required: [true, 'Role in case is required']
        },
        statusLabel: {
            type: String,
            enum: {
                values: ['ALLEGED', 'CASE_FILED', 'ON_TRIAL', 'CONVICTED', 'ACQUITTED'],
                message: '{VALUE} is not a valid status label'
            },
            required: [true, 'Status label is required']
        },
        source: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Source',
            required: [true, 'Source reference is required']
        }
    },
    {
        timestamps: true
    }
);

const CasePerson = mongoose.model('CasePerson', casePersonSchema);

export default CasePerson;
