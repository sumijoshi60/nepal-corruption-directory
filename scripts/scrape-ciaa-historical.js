import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

/**
 * CIAA Historical Scraper with Fiscal Year Support
 * Scrapes all corruption cases from 2015-2026 (11 years of data)
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
    }
};

// Fiscal years mapping (Nepali calendar)
const FISCAL_YEARS = [
    { value: '2', label: '2072/73', gregorian: '2015/16' },
    { value: '3', label: '2073/74', gregorian: '2016/17' },
    { value: '4', label: '2074/75', gregorian: '2017/18' },
    { value: '5', label: '2075/76', gregorian: '2018/19' },
    { value: '6', label: '2076/77', gregorian: '2019/20' },
    { value: '7', label: '2077/78', gregorian: '2020/21' },
    { value: '8', label: '2078/79', gregorian: '2021/22' },
    { value: '9', label: '2079/80', gregorian: '2022/23' },
    { value: '10', label: '2080/81', gregorian: '2023/24' },
    { value: '11', label: '2081/82', gregorian: '2024/25' },
    { value: '12', label: '2082/83', gregorian: '2025/26' } // Current
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape a single page with fiscal year filtering
 */
async function scrapeCIAAPage(url, category, fiscalYear = null, page = 1) {
    try {
        // Build URL with fiscal year if provided
        let pageUrl = fiscalYear
            ? `${url}?fiscal_year=${fiscalYear.value}&page=${page}`
            : page > 1
                ? `${url}?page=${page}`
                : url;

        const fyLabel = fiscalYear ? ` [FY ${fiscalYear.label}]` : '';
        console.log(`  Fetching page ${page}${fyLabel}...`);

        const response = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const cases = [];

        $('table tbody tr').each((index, row) => {
            try {
                const $row = $(row);
                const cells = $row.find('td');

                if (cells.length < 4) return;

                const dateText = $(cells[0]).text().trim();
                const titleText = $(cells[1]).text().trim();
                const titleLink = $(cells[1]).find('a').attr('href');

                let accusedPerson = '';
                let office = '';
                let accusation = '';
                let amount = '';

                if (cells.length >= 6) {
                    accusedPerson = $(cells[2]).text().trim();
                    office = $(cells[3]).text().trim();
                    accusation = $(cells[4]).text().trim();
                    amount = $(cells[5]).text().trim();
                } else if (cells.length >= 4) {
                    accusedPerson = $(cells[2]).text().trim();
                    office = $(cells[3]).text().trim();
                }

                const detailUrl = titleLink
                    ? (titleLink.startsWith('http') ? titleLink : `https://ciaa.gov.np${titleLink}`)
                    : null;

                const dateMatch = dateText.match(/\d{4}[-\/]\d{2}[-\/]\d{2}/);
                const parsedDate = dateMatch ? dateMatch[0].replace(/\//g, '/') : dateText;

                const caseId = detailUrl ? detailUrl.split('/').pop() : `${category}_${fiscalYear?.value || 'current'}_${page}_${index}`;

                const caseData = {
                    id: caseId,
                    category: CATEGORIES[category].name,
                    categoryType: CATEGORIES[category].type,
                    fiscalYear: fiscalYear ? fiscalYear.label : 'current',
                    fiscalYearGregorian: fiscalYear ? fiscalYear.gregorian : '2025/26',
                    date: parsedDate,
                    title: titleText,
                    accusedPerson: accusedPerson,
                    office: office,
                    accusation: accusation,
                    amount: amount,
                    detailUrl: detailUrl,
                    scrapedAt: new Date().toISOString(),
                    sourceUrl: pageUrl
                };

                if (titleText || accusedPerson) {
                    cases.push(caseData);
                }

            } catch (error) {
                console.error(`  Error parsing row ${index}:`, error.message);
            }
        });

        // Check for next page
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
 * Scrape all pages for a category + fiscal year combination
 */
async function scrapeCategoryByYear(category, fiscalYear = null, maxPages = 20) {
    const allCases = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
        const result = await scrapeCIAAPage(CATEGORIES[category].url, category, fiscalYear, currentPage);
        allCases.push(...result.cases);

        hasMore = result.hasNextPage && result.cases.length > 0;

        if (hasMore) {
            currentPage++;
            await delay(1500); // Rate limiting
        } else {
            break;
        }
    }

    return allCases;
}

/**
 * Scrape all historical data for all categories
 */
async function scrapeAllHistoricalData(options = {}) {
    const {
        categories = ['charge', 'sting', 'appeal'],
        fiscalYears = FISCAL_YEARS,
        maxPagesPerCategory = 20,
        outputFile = 'ciaa-historical-cases.json'
    } = options;

    console.log('\n' + '='.repeat(80));
    console.log('🏛️  CIAA HISTORICAL DATA SCRAPER');
    console.log('   Scraping cases from 2015-2026 (11 fiscal years)');
    console.log('='.repeat(80));

    const allCases = [];
    let totalByYear = {};
    let totalByCategory = {};

    // Loop through each category
    for (const category of categories) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 Category: ${CATEGORIES[category].name}`);
        console.log(`${'='.repeat(80)}\n`);

        // Loop through each fiscal year
        for (const fiscalYear of fiscalYears) {
            console.log(`\n📅 Fiscal Year: ${fiscalYear.label} (${fiscalYear.gregorian})`);

            const cases = await scrapeCategoryByYear(category, fiscalYear, maxPagesPerCategory);

            console.log(`  ✓ Found ${cases.length} cases`);

            allCases.push(...cases);

            // Track statistics
            const key = `${fiscalYear.label}`;
            totalByYear[key] = (totalByYear[key] || 0) + cases.length;
            totalByCategory[CATEGORIES[category].name] = (totalByCategory[CATEGORIES[category].name] || 0) + cases.length;

            // Delay between fiscal years
            await delay(2000);
        }

        // Delay between categories
        await delay(3000);
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Total cases scraped: ${allCases.length}`);

    console.log('\n📋 By Category:');
    Object.entries(totalByCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            console.log(`  ${cat}: ${count} cases`);
        });

    console.log('\n📅 By Fiscal Year:');
    Object.entries(totalByYear)
        .sort()
        .forEach(([year, count]) => {
            const fy = FISCAL_YEARS.find(f => f.label === year);
            console.log(`  ${year} (${fy?.gregorian}): ${count} cases`);
        });

    // Save to file
    const outputPath = `${process.cwd()}/${outputFile}`;
    fs.writeFileSync(outputPath, JSON.stringify(allCases, null, 2));
    console.log(`\n✓ Saved ${allCases.length} cases to: ${outputFile}`);
    console.log('='.repeat(80) + '\n');

    return allCases;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    scrapeAllHistoricalData({
        categories: ['charge', 'sting', 'appeal'],
        fiscalYears: FISCAL_YEARS, // All years from 2015-2026
        maxPagesPerCategory: 20,
        outputFile: 'ciaa-historical-cases.json'
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { scrapeAllHistoricalData, scrapeCategoryByYear, scrapeCIAAPage, FISCAL_YEARS };
