import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: {
                values: ['NEWS', 'OFFICIAL', 'COURT'],
                message: '{VALUE} is not a valid source type'
            },
            required: [true, 'Source type is required']
        },
        publisher: {
            type: String,
            required: [true, 'Publisher is required'],
            trim: true
        },
        url: {
            type: String,
            required: [true, 'URL is required'],
            trim: true
        },
        publishedDate: {
            type: Date
        },
        language: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Source = mongoose.model('Source', sourceSchema);

export default Source;
