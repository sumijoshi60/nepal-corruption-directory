import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import Case from '../src/models/Case.js';
import Source from '../src/models/Source.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nepal-corruption-directory';

/**
 * Map CIAA category to case status
 */
function mapCategoryToStatus(category) {
    const mapping = {
        'Charge Sheet': 'CASE_FILED',
        'Sting Operation': 'UNDER_INVESTIGATION',
        'Appeal': 'ON_TRIAL'
    };
    return mapping[category] || 'ALLEGED';
}

/**
 * Extract location from office field (best effort)
 */
function extractLocation(office) {
    if (!office || office === '-' || office === 'N/A') return 'Nepal';

    // Common locations in Nepal
    const locations = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Chitwan', 'Bharatpur'];

    for (const loc of locations) {
        if (office.includes(loc)) return loc;
    }

    return 'Nepal';
}

/**
 * Import CIAA cases from JSON file into MongoDB
 */
async function importCIAACases() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('📥 CIAA CASES IMPORT');
        console.log('='.repeat(80) + '\n');

        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Read JSON file
        const jsonPath = path.join(__dirname, 'ciaa-historical-cases.json');
        console.log(`📂 Reading file: ${jsonPath}`);

        if (!fs.existsSync(jsonPath)) {
            throw new Error(`File not found: ${jsonPath}`);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const ciaaData = JSON.parse(rawData);

        console.log(`✓ Loaded ${ciaaData.length} cases from JSON\n`);

        // Create or find CIAA source
        console.log('📌 Creating CIAA source record...');
        let ciaaSource = await Source.findOne({
            publisher: 'Commission for the Investigation of Abuse of Authority (CIAA)',
            type: 'OFFICIAL'
        });

        if (!ciaaSource) {
            ciaaSource = await Source.create({
                type: 'OFFICIAL',
                publisher: 'Commission for the Investigation of Abuse of Authority (CIAA)',
                url: 'https://ciaa.gov.np',
                language: 'Nepali'
            });
            console.log('✓ Created CIAA source\n');
        } else {
            console.log('✓ CIAA source already exists\n');
        }

        // Check for existing CIAA cases
        const existingCount = await Case.countDocuments({ dataSource: 'CIAA' });
        console.log(`📊 Existing CIAA cases in database: ${existingCount}`);

        if (existingCount > 0) {
            console.log('\n⚠️  WARNING: CIAA cases already exist in database!');
            console.log('Options:');
            console.log('  1. Delete existing: db.cases.deleteMany({ dataSource: "CIAA" })');
            console.log('  2. Skip duplicates (will check by detailUrl)\n');

            // For now, we'll skip duplicates
            console.log('Proceeding with duplicate checking...\n');
        }

        // Transform and import cases
        console.log('🔄 Processing cases...');
        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < ciaaData.length; i++) {
            const ciaaCase = ciaaData[i];

            try {
                // Check if case already exists
                if (ciaaCase.detailUrl) {
                    const existing = await Case.findOne({ detailUrl: ciaaCase.detailUrl });
                    if (existing) {
                        skipped++;
                        continue;
                    }
                }

                // Transform CIAA data to Case model
                const caseData = {
                    title: ciaaCase.title || 'Untitled',
                    summary: ciaaCase.title || 'No summary available',
                    caseStatus: mapCategoryToStatus(ciaaCase.category),
                    institution: `CIAA - ${ciaaCase.category}`,
                    location: extractLocation(ciaaCase.office),
                    amountInvolved: ciaaCase.amount && ciaaCase.amount !== 'N/A' ? ciaaCase.amount : null,
                    dateReported: new Date(ciaaCase.date),
                    visibility: 'PUBLISHED',
                    // CIAA-specific fields
                    category: ciaaCase.category,
                    categoryType: ciaaCase.categoryType,
                    fiscalYear: ciaaCase.fiscalYear,
                    fiscalYearGregorian: ciaaCase.fiscalYearGregorian,
                    accusedPerson: ciaaCase.accusedPerson && ciaaCase.accusedPerson !== 'N/A' ? ciaaCase.accusedPerson : null,
                    office: ciaaCase.office && ciaaCase.office !== 'N/A' ? ciaaCase.office : null,
                    accusation: ciaaCase.accusation && ciaaCase.accusation !== '-' ? ciaaCase.accusation : null,
                    detailUrl: ciaaCase.detailUrl,
                    sourceUrl: ciaaCase.sourceUrl,
                    dataSource: 'CIAA'
                };

                await Case.create(caseData);
                imported++;

                // Progress indicator
                if ((imported + skipped) % 100 === 0) {
                    console.log(`  Progress: ${imported + skipped}/${ciaaData.length} processed (${imported} imported, ${skipped} skipped)`);
                }

            } catch (error) {
                errors++;
                console.error(`  ✗ Error importing case ${ciaaCase.id}: ${error.message}`);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(80));
        console.log(`\n✅ Successfully imported: ${imported} cases`);
        console.log(`⏭️  Skipped (duplicates): ${skipped} cases`);
        console.log(`❌ Errors: ${errors} cases`);
        console.log(`\n📈 Total CIAA cases in database: ${await Case.countDocuments({ dataSource: 'CIAA' })}`);
        console.log('='.repeat(80) + '\n');

        // Sample queries
        console.log('🔍 Sample queries to test:');
        console.log('  db.cases.find({ dataSource: "CIAA", category: "Charge Sheet" }).count()');
        console.log('  db.cases.find({ fiscalYear: "2082/83" }).count()');
        console.log('  db.cases.find({ dataSource: "CIAA" }).limit(5).pretty()');
        console.log('');

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
    }
}

// Run import
importCIAACases();
