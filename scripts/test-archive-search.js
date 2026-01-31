import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const debugArchiveSearch = async () => {
    try {
        console.log('Debugging archive search HTML structure...\n');

        const url = 'https://kathmandupost.com/archive?keyword=CIAA&date_from=2025-01-01&date_to=2026-01-30';
        console.log('URL:', url, '\n');

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Save raw HTML for inspection
        fs.writeFileSync('archive-search-raw.html', response.data);
        console.log('✓ Saved raw HTML to archive-search-raw.html\n');

        // Try different selectors
        console.log('Testing different CSS selectors:\n');

        const selectors = [
            'h3 > a',
            'h3 a',
            'article a',
            'a[href*="/national/"]',
            'a[href*="/politics/"]',
            '.archive-list a',
            '.result a',
            'div.col a'
        ];

        for (const selector of selectors) {
            const count = $(selector).length;
            console.log(`${selector.padEnd(30)} → ${count} elements`);

            if (count > 0 && count < 10) {
                $(selector).each((i, elem) => {
                    const href = $(elem).attr('href');
                    const text = $(elem).text().trim().slice(0, 60);
                    console.log(`   [${i + 1}] ${text} → ${href}`);
                });
            }
        }

        // Check if results container exists
        console.log('\n\nChecking for results container...');
        const bodyText = $('body').text();
        if (bodyText.includes('No results found') || bodyText.includes('no results')) {
            console.log('❌ "No results" message found');
        } else {
            console.log('✓ No "no results" message');
        }

        // Check for any script tags that might load content
        const scripts = $('script[src]').map((i, el) => $(el).attr('src')).get();
        console.log(`\n${scripts.length} script tags found`);

    } catch (error) {
        console.error('Error:', error.message);
    }
};

debugArchiveSearch();
