import dotenv from 'dotenv';
import Case from '../models/Case.js';
import CasePerson from '../models/CasePerson.js';
import Person from '../models/Person.js';

// Load environment variables
dotenv.config();

/**
 * Create MongoDB indexes for optimal query performance
 * Run this script to set up indexes for the Nepal Corruption Cases Directory
 */
export async function createIndexes() {
    console.log('Creating MongoDB indexes...\n');

    try {
        // ====== Case Collection Indexes ======
        console.log('Creating indexes for Case collection...');

        // Compound index for the most common query pattern
        await Case.collection.createIndex(
            { visibility: 1, dateReported: -1 },
            { name: 'visibility_dateReported_idx' }
        );
        console.log('✓ Created compound index: visibility + dateReported');

        // Index for location filtering
        await Case.collection.createIndex(
            { location: 1 },
            { name: 'location_idx' }
        );
        console.log('✓ Created index: location');

        // Text index for case title and summary search
        await Case.collection.createIndex(
            { title: 'text', summary: 'text' },
            { name: 'case_text_search_idx', weights: { title: 2, summary: 1 } }
        );
        console.log('✓ Created text index: title + summary (title weighted 2x)');

        // ====== CasePerson Collection Indexes ======
        console.log('\nCreating indexes for CasePerson collection...');

        // Compound index for case + role filtering
        await CasePerson.collection.createIndex(
            { case: 1, roleInCase: 1 },
            { name: 'case_role_idx' }
        );
        console.log('✓ Created compound index: case + roleInCase');

        // Single index for joining with cases
        await CasePerson.collection.createIndex(
            { case: 1 },
            { name: 'case_idx' }
        );
        console.log('✓ Created index: case');

        // Index for person reference (for reverse lookups)
        await CasePerson.collection.createIndex(
            { person: 1 },
            { name: 'person_idx' }
        );
        console.log('✓ Created index: person');

        // ====== Person Collection Indexes ======
        console.log('\nCreating indexes for Person collection...');

        // Text index for person name search
        await Person.collection.createIndex(
            { fullName: 'text' },
            { name: 'person_name_text_idx' }
        );
        console.log('✓ Created text index: fullName');

        // Index for political party filtering
        await Person.collection.createIndex(
            { 'politicalAffiliation.partyName': 1 },
            { name: 'political_party_idx' }
        );
        console.log('✓ Created index: politicalAffiliation.partyName');

        console.log('\n✅ All indexes created successfully!');
        console.log('\nTo view all indexes, you can run:');
        console.log('  db.cases.getIndexes()');
        console.log('  db.casepersons.getIndexes()');
        console.log('  db.people.getIndexes()');

        return true;
    } catch (error) {
        console.error('\n❌ Error creating indexes:', error.message);
        throw error;
    }
}

// If run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    import('../config/db.js').then(async (module) => {
        const connectDB = module.default;
        await connectDB();
        await createIndexes();
        process.exit(0);
    }).catch((error) => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    });
}

export default createIndexes;
