import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://kathmandupost.com';

console.log('Corruption Case Scraper Started');
console.log('Looking for CIAA investigations, court cases, and arrests...\n');

async function fetchHTML(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 10000,
        });
        return cheerio.load(data);
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

/**
 * Crawl a monthly archive page for corruption case articles
 */
async function crawlMonthlyArchive(year, month, category = 'national') {
    const monthStr = month.toString().padStart(2, '0');
    const archiveUrl = `${BASE_URL}/${category}/${year}/${monthStr}`;

    console.log(` Crawling: /${category}/${year}/${monthStr}`);

    const $ = await fetchHTML(archiveUrl);
    if (!$) return [];

    const caseUrls = [];

    // Keywords that indicate an actual corruption CASE
    const caseKeywords = [
        'ciaa files', 'ciaa case', 'ciaa charges',
        'arrested for', 'arrested in', 'charged with',
        'court files', 'case against', 'case filed',
        'investigation into', 'probe into',
        'embezzlement', 'land scam', 'land grab',
        'bribery case', 'corruption case', 'graft case',
        'money laundering', 'graft-case'
    ];

    // Keywords to EXCLUDE
    const excludeKeywords = [
        'editorial', 'opinion', 'interview', 'analysis',
        'columns', 'why corruption', 'how to', 'accord'
    ];

    $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase().trim();
        const urlLower = (href || '').toLowerCase();

        // Must match article URL pattern (has date)
        if (!href || !href.match(/^\/\w+\/\d{4}\/\d{2}\/\d{2}\//)) {
            return;
        }

        // Check for excluded keywords
        const hasExcluded = excludeKeywords.some(keyword =>
            text.includes(keyword) || urlLower.includes(keyword)
        );

        if (hasExcluded) return;

        // Check for case keywords
        const hasKeyword = caseKeywords.some(keyword =>
            text.includes(keyword) || urlLower.includes(keyword)
        );

        if (hasKeyword && text.length > 10) {
            const fullUrl = BASE_URL + href;
            caseUrls.push(fullUrl);
        }
    });

    return caseUrls;
}

/**
 * Crawl archives from recent years to find corruption cases
 */
async function crawlRecentArchives() {
    console.log('\n🗂️  Method 1: Archive Crawling\n');

    const currentYear = 2026;
    const currentMonth = 1; // January
    const allUrls = [];

    // Crawl last 2 years of archives (2024-2026)
    for (let year = currentYear; year >= 2023; year--) {
        const startMonth = (year === currentYear) ? currentMonth : 12;

        for (let month = startMonth; month >= 1; month--) {
            const urls = await crawlMonthlyArchive(year, month, 'national');
            allUrls.push(...urls);

            if (urls.length > 0) {
                console.log(`   ✓ Found ${urls.length} cases in ${year}/${month.toString().padStart(2, '0')}`);
            }

            // Respectful delay
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    // Remove duplicates
    const uniqueUrls = [...new Set(allUrls)];
    console.log(`\n  ✓ Archive crawling found ${uniqueUrls.length} unique articles\n`);

    return uniqueUrls;
}

/**
 * Scrape category pages for corruption cases (backup method)
 * Looks for: CIAA investigations, court filings, arrests, charges
 */
async function scrapeCategoryPages() {
    console.log('Searching for corruption cases across multiple categories...\n');

    const categories = ['/national', '/politics'];
    const allCaseLinks = [];

    // Keywords that indicate an actual corruption CASE
    const caseKeywords = [
        'ciaa files', 'ciaa case', 'ciaa charges',
        'arrested for', 'arrested in', 'charged with',
        'court files', 'case against', 'case filed',
        'investigation into', 'probe into',
        'embezzlement', 'land scam', 'land grab',
        'bribery case', 'corruption case', 'graft case'
    ];

    // Keywords to EXCLUDE (these are opinion/analysis pieces, not cases)
    const excludeKeywords = [
        'editorial', 'opinion', 'interview', 'analysis',
        'columns', 'why corruption', 'how to',
        'gen z', 'accord'
    ];

    for (const category of categories) {
        const categoryUrl = `${BASE_URL}${category}`;
        console.log(`Checking ${categoryUrl}...`);

        const $ = await fetchHTML(categoryUrl);
        if (!$) continue;

        $('a').each((_, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().toLowerCase().trim();
            const urlLower = (href || '').toLowerCase();

            // Must match article URL pattern (has date)
            if (!href || !href.match(/^\/\w+\/\d{4}\/\d{2}\/\d{2}\//)) {
                return;
            }

            // Check if URL or link text contains excluded keywords
            const hasExcluded = excludeKeywords.some(keyword =>
                text.includes(keyword) || urlLower.includes(keyword)
            );

            if (hasExcluded) return;

            // Check if URL or link text contains case keywords
            const hasKeyword = caseKeywords.some(keyword =>
                text.includes(keyword) || urlLower.includes(keyword)
            );

            if (hasKeyword && text.length > 10) {
                const fullUrl = BASE_URL + href;
                allCaseLinks.push({
                    url: fullUrl,
                    title: $(el).text().trim(),
                    matchedOn: text
                });
                console.log(`  ✓ Found: "${$(el).text().trim().substring(0, 60)}..."`);
            }
        });
    }

    // Remove duplicates
    const uniqueCases = [...new Map(allCaseLinks.map(item => [item.url, item])).values()];
    console.log(`\n  ✓ Category pages found ${uniqueCases.length} cases\n`);

    return uniqueCases.map(c => c.url);
}

/**
 * Main function: Combines all discovery methods
 */
async function findCorruptionCases() {
    console.log('\n================================================================================');
    console.log('DISCOVERING CORRUPTION CASES - MULTI-METHOD APPROACH');
    console.log('================================================================================\n');

    const allUrls = [];

    try {
        // Method 1: Archive Crawling (primary - finds historical cases)
        const archiveResults = await crawlRecentArchives();
        allUrls.push(...archiveResults);
    } catch (error) {
        console.error('Archive crawling failed:', error.message);
    }

    try {
        // Method 2: Category pages (backup - finds recent cases on front page)
        console.log('\n📋 Method 2: Category Pages\\n');
        const categoryResults = await scrapeCategoryPages();
        allUrls.push(...categoryResults);
    } catch (error) {
        console.error('Category scraping failed:', error.message);
    }

    // Remove duplicates
    const uniqueUrls = [...new Set(allUrls)];

    console.log('\n================================================================================');
    console.log(`DISCOVERY COMPLETE: ${uniqueUrls.length} unique corruption cases found`);
    console.log('================================================================================\n');

    return uniqueUrls;
}

/**
 * Extracts detailed information from a corruption case article
 */
async function scrapeCorruptionCase(url) {
    console.log(`\nScraping case: ${url}`);
    const $ = await fetchHTML(url);

    if (!$) {
        console.log('  Failed to fetch');
        return null;
    }

    const title = $('h1').first().text().trim() || $('title').text().trim();
    const dateReported = $('time').attr('datetime') || $('meta[property="article:published_time"]').attr('content') || null;

    const paragraphs = [];

    // Try multiple selectors to find article content
    const articleSelectors = ['article p', '.story-content p', '.article-content p', 'div[class*="content"] p'];

    for (const selector of articleSelectors) {
        $(selector).each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 20) {
                paragraphs.push(text);
            }
        });
        if (paragraphs.length > 0) break;
    }

    // Fallback: get all paragraphs if specific selectors don't work
    if (paragraphs.length === 0) {
        $('p').each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 50) {
                paragraphs.push(text);
            }
        });
    }

    // Extract case-specific details from the content
    const fullText = paragraphs.join(' ').toLowerCase();

    // Try to identify the type of case
    let caseType = 'Corruption';
    if (fullText.includes('embezzlement')) caseType = 'Embezzlement';
    else if (fullText.includes('land scam') || fullText.includes('land grab')) caseType = 'Land Scam';
    else if (fullText.includes('bribery') || fullText.includes('bribe')) caseType = 'Bribery';
    else if (fullText.includes('ciaa')) caseType = 'CIAA Investigation';

    // Try to extract accused names (basic pattern matching)
    const accused = [];
    const namePatterns = [
        /case against ([A-Z][a-z]+ [A-Z][a-z]+)/g,
        /charged ([A-Z][a-z]+ [A-Z][a-z]+)/g,
        /arrested ([A-Z][a-z]+ [A-Z][a-z]+)/g
    ];

    const fullRawText = paragraphs.join(' ');
    namePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(fullRawText)) !== null && accused.length < 5) {
            if (!accused.includes(match[1])) {
                accused.push(match[1]);
            }
        }
    });

    console.log(`  ✓ Type: ${caseType}`);
    console.log(`  ✓ Content: ${paragraphs.length} paragraphs`);

    return {
        title,
        caseType,
        dateReported,
        accused: accused.length > 0 ? accused : null,
        sourceName: 'The Kathmandu Post',
        sourceUrl: url,
        summary: paragraphs.slice(0, 3).join(' '),
        rawContent: paragraphs.join('\n'),
    };
}

// Main execution
(async () => {
    try {
        console.log('='.repeat(80));
        console.log('KATHMANDU POST CORRUPTION CASE SCRAPER');
        console.log('='.repeat(80));
        console.log('\nThis scraper finds actual corruption CASES (CIAA investigations,');
        console.log('court filings, arrests) - not general corruption articles.\n');

        const caseUrls = await findCorruptionCases();

        if (caseUrls.length === 0) {
            console.log('\n⚠️  No corruption cases found on current category pages.');
            console.log('\nTip: The /national and /politics pages may not have corruption cases');
            console.log('on the front page right now. You can:');
            console.log('  1. Search Google for: site:kathmandupost.com "CIAA files case"');
            console.log('  2. Check the /national archive or search functionality');
            console.log('  3. Run this script later when new cases are reported\n');
            return;
        }

        const results = [];

        for (const url of caseUrls) {
            const caseData = await scrapeCorruptionCase(url);
            if (caseData && caseData.rawContent) {
                results.push(caseData);
            }
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n' + '='.repeat(80));
        console.log('RESULTS');
        console.log('='.repeat(80));
        console.log(JSON.stringify(results, null, 2));
        console.log(`\n✓ Successfully scraped ${results.length} corruption cases`);

        if (results.length > 0) {
            console.log('\nCase types found:');
            const types = [...new Set(results.map(r => r.caseType))];
            types.forEach(type => {
                const count = results.filter(r => r.caseType === type).length;
                console.log(`  - ${type}: ${count} case(s)`);
            });
        }
    } catch (error) {
        console.error('\n❌ Scraper error:', error.message);
        console.error(error.stack);
    }
})();
