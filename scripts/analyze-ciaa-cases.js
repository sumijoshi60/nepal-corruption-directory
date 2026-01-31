import fs from 'fs';

/**
 * Analyze CIAA cases JSON file and provide detailed statistics
 */

// Read the scraped data
const casesData = JSON.parse(fs.readFileSync('./ciaa-cases.json', 'utf-8'));

console.log('\n' + '='.repeat(80));
console.log('📊 CIAA CASES ANALYSIS');
console.log('='.repeat(80));

console.log(`\n🔢 Total cases scraped: ${casesData.length}\n`);

// Group by category
const byCategory = {};
casesData.forEach(c => {
    byCategory[c.category] = (byCategory[c.category] || []);
    byCategory[c.category].push(c);
});

console.log('📋 Cases by Category:');
Object.entries(byCategory).forEach(([cat, cases]) => {
    console.log(`  ${cat}: ${cases.length} cases`);
});

// Group by accusation type
console.log('\n⚖️  Cases by Accusation Type:');
const byAccusation = {};
casesData.forEach(c => {
    const acc = c.accusation || 'Not specified';
    byAccusation[acc] = (byAccusation[acc] || 0) + 1;
});

Object.entries(byAccusation)
    .sort((a, b) => b[1] - a[1])
    .forEach(([acc, count]) => {
        console.log(`  ${acc}: ${count} cases`);
    });

// Extract amounts from titles (Nepali number format)
console.log('\n💰 Amount Analysis:');
const casesWithAmounts = [];
const nepaliDigits = '०१२३४५६७८९';
const englishDigits = '0123456789';

function convertNepaliToEnglish(text) {
    let result = text;
    for (let i = 0; i < nepaliDigits.length; i++) {
        result = result.replace(new RegExp(nepaliDigits[i], 'g'), englishDigits[i]);
    }
    return result;
}

casesData.forEach(c => {
    const title = c.title;
    // Pattern: रू.X,XX,XX,XXX।XX or रु.X,XX,XX,XXX।XX
    const amountPattern = /रू?\.\s?([\d०-९,।.]+)/g;
    let match;
    while ((match = amountPattern.exec(title)) !== null) {
        const nepaliAmount = match[1];
        // Convert Nepali digits to English
        const englishAmount = convertNepaliToEnglish(nepaliAmount);
        // Remove commas and Nepali decimal separator (।)
        const numericAmount = parseFloat(englishAmount.replace(/[,।]/g, ''));

        if (!isNaN(numericAmount) && numericAmount > 0) {
            casesWithAmounts.push({
                id: c.id,
                category: c.category,
                amount: numericAmount,
                amountText: match[0],
                title: c.title.substring(0, 100) + '...'
            });
        }
    }
});

console.log(`  Cases with amounts in title: ${casesWithAmounts.length}`);

if (casesWithAmounts.length > 0) {
    const amounts = casesWithAmounts.map(c => c.amount);
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
    const avgAmount = totalAmount / amounts.length;
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);

    console.log(`  Total amount: Rs ${totalAmount.toLocaleString('en-IN')}`);
    console.log(`  Average amount: Rs ${Math.round(avgAmount).toLocaleString('en-IN')}`);
    console.log(`  Largest amount: Rs ${maxAmount.toLocaleString('en-IN')}`);
    console.log(`  Smallest amount: Rs ${minAmount.toLocaleString('en-IN')}`);

    console.log('\n🏆 Top 10 Cases by Amount:');
    casesWithAmounts
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .forEach((c, i) => {
            console.log(`  ${i + 1}. Rs ${c.amount.toLocaleString('en-IN')} - ${c.category}`);
            console.log(`     ${c.title}\n`);
        });
}

// Date range analysis
console.log('\n📅 Date Range:');
const dates = casesData.map(c => c.date).filter(d => d && d.length > 0).sort();
if (dates.length > 0) {
    console.log(`  Earliest: ${dates[0]}`);
    console.log(`  Latest: ${dates[dates.length - 1]}`);
}

// Count cases with detail URLs
const withDetails = casesData.filter(c => c.detailUrl).length;
console.log(`\n🔗 Cases with detail URLs: ${withDetails} (${Math.round(withDetails / casesData.length * 100)}%)`);

// Sample a few cases
console.log('\n📝 Sample Cases:\n');
casesData.slice(0, 3).forEach((c, i) => {
    console.log(`${i + 1}. [${c.category}] ${c.date}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Accused: ${c.accusedPerson}`);
    console.log(`   Office: ${c.office}`);
    console.log(`   Type: ${c.accusation}`);
    console.log(`   URL: ${c.detailUrl}\n`);
});

console.log('='.repeat(80) + '\n');
