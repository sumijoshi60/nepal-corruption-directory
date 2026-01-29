import mongoose from 'mongoose';

const personSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true
        },
        position: {
            type: String,
            trim: true
        },
        organization: {
            type: String,
            trim: true
        },
        politicalAffiliation: {
            partyName: {
                type: String,
                trim: true
            },
            source: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Source'
            }
        }
    },
    {
        timestamps: true
    }
);

const Person = mongoose.model('Person', personSchema);

export default Person;
