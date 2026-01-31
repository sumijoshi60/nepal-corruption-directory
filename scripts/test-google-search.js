import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Search Kathmandu Post using Google's site: search operator
 * This bypasses their JavaScript-based search and gets results directly from Google
 */
const googleSiteSearch = async (query, maxPages = 3) => {
    const results = [];

    try {
        // Google search with site: operator
        const searchQuery = `site:kathmandupost.com ${query}`;
        console.log(`\n🔍 Searching Google for: "${searchQuery}"\n`);

        for (let page = 0; page < maxPages; page++) {
            const start = page * 10;
            const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&start=${start}`;

            console.log(`Fetching page ${page + 1}...`);

            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                });

                const $ = cheerio.load(response.data);

                // Google search result selectors (these work for standard Google SERP)
                const selectors = [
                    'div.g a[href*="kathmandupost.com"]',  // Standard result links
                    'a[href*="kathmandupost.com"][ping]',   // Result links with tracking
                    'h3 > a[href*="kathmandupost.com"]'     // Title links
                ];

                let foundResults = false;

                for (const selector of selectors) {
                    $(selector).each((i, elem) => {
                        const href = $(elem).attr('href');

                        // Extract actual URL (Google sometimes wraps URLs)
                        let cleanUrl = href;
                        if (href.includes('/url?q=')) {
                            const match = href.match(/url\?q=([^&]+)/);
                            if (match) {
                                cleanUrl = decodeURIComponent(match[1]);
                            }
                        }

                        // Only kathmandupost.com article URLs
                        if (cleanUrl && cleanUrl.includes('kathmandupost.com/') &&
                            !cleanUrl.includes('/search') &&
                            !cleanUrl.includes('/archive')) {

                            // Check if we already have this URL
                            if (!results.some(r => r.url === cleanUrl)) {
                                results.push({ url: cleanUrl });
                                foundResults = true;
                            }
                        }
                    });

                    if (foundResults) break; // Found results with this selector, no need to try others
                }

                if (!foundResults) {
                    console.log(`  No results found on page ${page + 1}, stopping search`);
                    break;
                }

                console.log(`  Found ${results.length} total URLs so far`);

                // Rate limiting - be respectful to Google
                if (page < maxPages - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                }

            } catch (error) {
                if (error.response?.status === 429) {
                    console.log(`  ⚠️ Rate limited by Google, stopping search`);
                    break;
                }
                console.log(`  Error on page ${page + 1}:`, error.message);
            }
        }

        console.log(`\n✓ Total unique URLs found: ${results.length}\n`);
        return results;

    } catch (error) {
        console.error('Error in Google site search:', error.message);
        return results;
    }
};

// Test it
const testSearch = async () => {
    console.log('='.repeat(70));
    console.log('Testing Google Site Search for Corruption Cases');
    console.log('='.repeat(70));

    const queries = [
        'CIAA files case',
        'corruption case filed',
        'arrested for corruption'
    ];

    const allResults = [];

    for (const query of queries) {
        const results = await googleSiteSearch(query, 2); // 2 pages = 20 results max per query
        allResults.push(...results);
    }

    // Deduplicate
    const uniqueUrls = [...new Set(allResults.map(r => r.url))];
    console.log('\n' + '='.repeat(70));
    console.log(`📊 SUMMARY: Found ${uniqueUrls.length} unique article URLs\n`);

    uniqueUrls.slice(0, 10).forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
    });

    if (uniqueUrls.length > 10) {
        console.log(`\n... and ${uniqueUrls.length - 10} more URLs`);
    }

    console.log('\n' + '='.repeat(70));
};

testSearch();
