import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

/**
 * CIAA Official Website Scraper
 * Scrapes corruption cases from ciaa.gov.np official press releases
 * 
 * Categories:
 * - Charge Sheets: Cases formally filed in court
 * - Sting Operations: Red-handed arrests
 * - Appeals: Supreme Court appeals
 * - Others: Miscellaneous updates
 */

// Category mappings
const CATEGORIES = {
    charge: {
        name: 'Charge Sheet',
        url: 'https://ciaa.gov.np/pressreleaseCategory/charge',
        type: 'court_filing'
    },
    sting: {
        name: 'Sting Operation',
        url: 'https://ciaa.gov.np/pressreleaseCategory/sting',
        type: 'arrest'
    },
    appeal: {
        name: 'Appeal',
        url: 'https://ciaa.gov.np/pressreleaseCategory/appeal',
        type: 'appeal'
    },
    others: {
        name: 'Others',
        url: 'https://ciaa.gov.np/pressreleaseCategory/others',
        type: 'other'
    }
};

// Utility: Add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape a single page from CIAA website
 */
async function scrapeCIAAPage(url, category, page = 1) {
    try {
        const pageUrl = page > 1 ? `${url}?page=${page}` : url;
        console.log(`  Fetching: ${pageUrl}`);

        const response = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const cases = [];

        // Find all table rows (skip header row)
        $('table tbody tr').each((index, row) => {
            try {
                const $row = $(row);
                const cells = $row.find('td');

                // Skip if not enough cells
                if (cells.length < 4) return;

                // Extract data from table columns
                // Typical structure: Date | Title | Accused Person | Office | Accusation | Amount
                const dateText = $(cells[0]).text().trim();
                const titleText = $(cells[1]).text().trim();
                const titleLink = $(cells[1]).find('a').attr('href');

                // Some tables have different column structures, adapt accordingly
                let accusedPerson = '';
                let office = '';
                let accusation = '';
                let amount = '';

                if (cells.length >= 6) {
                    // Full structure
                    accusedPerson = $(cells[2]).text().trim();
                    office = $(cells[3]).text().trim();
                    accusation = $(cells[4]).text().trim();
                    amount = $(cells[5]).text().trim();
                } else if (cells.length >= 4) {
                    // Simplified structure - extract from title
                    accusedPerson = $(cells[2]).text().trim();
                    office = $(cells[3]).text().trim();
                }

                // Get full detail page URL
                const detailUrl = titleLink
                    ? (titleLink.startsWith('http') ? titleLink : `https://ciaa.gov.np${titleLink}`)
                    : null;

                // Parse date (format: YYYY-MM-DD in Nepali calendar, need to handle)
                const dateMatch = dateText.match(/\d{4}-\d{2}-\d{2}/);
                const parsedDate = dateMatch ? dateMatch[0] : dateText;

                // Extract PDF/Word download links
                const downloadLinks = [];
                $row.find('a[href$=".pdf"], a[href$=".docx"], a[href$=".doc"]').each((i, link) => {
                    const href = $(link).attr('href');
                    downloadLinks.push(href.startsWith('http') ? href : `https://ciaa.gov.np${href}`);
                });

                const caseData = {
                    id: detailUrl ? detailUrl.split('/').pop() : `${category}_${page}_${index}`,
                    category: CATEGORIES[category].name,
                    categoryType: CATEGORIES[category].type,
                    date: parsedDate,
                    title: titleText,
                    accusedPerson: accusedPerson,
                    office: office,
                    accusation: accusation,
                    amount: amount,
                    detailUrl: detailUrl,
                    downloadLinks: downloadLinks,
                    scrapedAt: new Date().toISOString(),
                    sourceUrl: pageUrl
                };

                // Only add if we have meaningful data
                if (titleText || accusedPerson) {
                    cases.push(caseData);
                }

            } catch (error) {
                console.error(`  Error parsing row ${index}:`, error.message);
            }
        });

        console.log(`  ✓ Found ${cases.length} cases on page ${page}`);

        // Check if there's a next page
        const hasNextPage = $('.pagination a[rel="next"]').length > 0 ||
            $('.pagination a').last().text().includes('Next') ||
            $('.pagination a').last().text().includes('»');

        return {
            cases,
            hasNextPage
        };

    } catch (error) {
        console.error(`  ✗ Error scraping page ${page}:`, error.message);
        return {
            cases: [],
            hasNextPage: false
        };
    }
}

/**
 * Scrape all pages for a specific category
 */
async function scrapeCIAACategory(category, maxPages = 10) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 Scraping CIAA Category: ${CATEGORIES[category].name}`);
    console.log(`${'='.repeat(70)}\n`);

    const allCases = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
        const result = await scrapeCIAAPage(CATEGORIES[category].url, category, currentPage);
        allCases.push(...result.cases);

        hasMore = result.hasNextPage && result.cases.length > 0;

        if (hasMore) {
            currentPage++;
            await delay(1500); // Be respectful with rate limiting
        } else {
            break;
        }
    }

    console.log(`\n✓ Total cases scraped from ${CATEGORIES[category].name}: ${allCases.length}\n`);
    return allCases;
}

/**
 * Scrape all CIAA categories
 */
async function scrapeAllCIAACategories(options = {}) {
    const {
        categories = ['charge', 'sting', 'appeal'],
        maxPagesPerCategory = 10,
        outputFile = 'ciaa-cases.json'
    } = options;

    console.log('\n' + '='.repeat(70));
    console.log('🏛️  CIAA Official Website Scraper');
    console.log('   Source: ciaa.gov.np');
    console.log('='.repeat(70));

    const allCases = [];

    for (const category of categories) {
        if (!CATEGORIES[category]) {
            console.log(`⚠️  Unknown category: ${category}, skipping...`);
            continue;
        }

        const cases = await scrapeCIAACategory(category, maxPagesPerCategory);
        allCases.push(...cases);

        // Delay between categories
        await delay(2000);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total cases scraped: ${allCases.length}`);

    // Count by category
    const byCategoryType = {};
    allCases.forEach(c => {
        byCategoryType[c.category] = (byCategoryType[c.category] || 0) + 1;
    });

    Object.entries(byCategoryType).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} cases`);
    });

    // Count cases with amounts
    const withAmounts = allCases.filter(c => c.amount && c.amount.trim()).length;
    console.log(`\nCases with amount specified: ${withAmounts}`);

    // Save to file
    const outputPath = `${process.cwd()}/${outputFile}`;
    fs.writeFileSync(outputPath, JSON.stringify(allCases, null, 2));
    console.log(`\n✓ Saved ${allCases.length} cases to: ${outputFile}`);
    console.log('='.repeat(70) + '\n');

    return allCases;
}

// Run scraper if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    scrapeAllCIAACategories({
        categories: ['charge', 'sting', 'appeal'],
        maxPagesPerCategory: 5, // Start with 5 pages per category for testing
        outputFile: 'ciaa-cases.json'
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { scrapeAllCIAACategories, scrapeCIAACategory, scrapeCIAAPage };
