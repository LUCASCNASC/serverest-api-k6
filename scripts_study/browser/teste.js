import { browser } from 'k6/browser';


export const options = {
    scenarios: {
        my_scenario: {
            executor: 'shared-iterations',
            vus: 1,
            iterations: 1,
            options: {
                browser: {
                    type: 'chromium',
                }
            }
        }
    },
    thresholds: {
        'browser_web_vital_fcp': ['p(75)<3000'],
        'browser_web_vital_fid': ['p(75)<2000'],
        'browser_web_vital_lcp': ['p(75)<2500'],
        'browser_web_vital_ttfb': ['p(75)<2000'],
    }

};

export default async function () {
    const baseUrl = 'https://automationexercise.com'
    const page = await browser.newPage();

    await page.goto(`${baseUrl}\\login`);
    await page.locator('[data-qa="login-email"]').fill('testessss123456@teste.com');
    await page.locator('[data-qa="login-password"]').fill('123456');
    await page.locator('[data-qa="login-button"]').click();
    await page.waitForSelector('[href="/logout"]');

    await page.locator('[class="single-products"]').nth(0).hover();
    await page.locator('.overlay-content .add-to-cart').nth(0).click();

    await page.close();
};
