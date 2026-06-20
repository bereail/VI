import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
});

const context = await browser.newContext();
const page = await context.newPage();

const appErrors = [];
const apiCalls = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    const t = msg.text();
    if (!t.includes('content.js') && !t.includes('polyfill.js') && !t.includes('ReceivingEnd'))
      appErrors.push(t);
  }
});

page.on('response', resp => {
  if (resp.url().includes('themoviedb.org'))
    apiCalls.push({ status: resp.status(), path: resp.url().replace('https://api.themoviedb.org/3','') });
});

// Step 1: load
console.log('=== 1. Load login page ===');
await page.goto('http://localhost:5176', { waitUntil: 'networkidle', timeout: 15000 });
await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_01_login.png' });
console.log('Title:', await page.title());
console.log('VI logo visible:', await page.locator('text=VI').first().isVisible());

// Step 2: register
console.log('\n=== 2. Register ===');
await page.click('button:has-text("Registrarse")');
await page.fill('#email', `tester_${Date.now()}@vi.com`);
await page.fill('#password', 'testpass123');
await page.fill('#password2', 'testpass123');
await page.click('button[type="submit"]');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_02_library.png' });
const inLibrary = await page.locator('header').first().isVisible();
console.log('Entered library after register:', inLibrary);

// Step 3: open TMDB search
console.log('\n=== 3. Open TMDB search ===');
await page.click('button:has-text("TMDB")');
await page.waitForTimeout(400);
await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_03_search_open.png' });

// Step 4: search Titanic
console.log('\n=== 4. Search "Titanic" ===');
await page.fill('input[placeholder*="TMDB"]', 'Titanic');
await page.waitForTimeout(2500);
await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_04_results.png' });

const resultItems = page.locator('[class*="result"]');
const resultCount = await resultItems.count();
const errorEl = page.locator('[class*="error"]');
const hasError = await errorEl.isVisible().catch(() => false);
console.log('Results count:', resultCount);
console.log('Error shown:', hasError, hasError ? await errorEl.textContent() : '');

console.log('\nAPI calls so far:');
apiCalls.forEach(c => console.log(' ', c.status, c.path.split('?')[0]));

// Step 5: select first result
if (resultCount > 0) {
  const firstTitle = await resultItems.first().locator('[class*="resultTitle"]').textContent().catch(() => '');
  console.log('\n=== 5. Select:', firstTitle, '===');
  await resultItems.first().click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_05_add_form.png' });

  const posterImg = page.locator('[class*="posterPreview"] img');
  const hasPoster = await posterImg.isVisible().catch(() => false);
  console.log('Poster in form:', hasPoster);
  if (hasPoster) {
    const src = await posterImg.getAttribute('src');
    console.log('Poster URL:', src?.substring(0, 60) + '...');
  }

  const directorVal = await page.locator('input[placeholder*="director"]').inputValue().catch(() => '');
  const yearVal = await page.locator('input[type="number"][placeholder="2024"]').inputValue().catch(() => '');
  console.log('Director auto-filled:', directorVal || '(empty)');
  console.log('Year auto-filled:', yearVal || '(empty)');

  // mark as vista + date — scope to modal to avoid hitting library tab
  await page.locator('.modal-panel button:has-text("Vista")').click();
  await page.waitForTimeout(300);
  await page.fill('input[type="date"]', '2025-06-20');
  await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_06_form_filled.png' });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_07_after_save.png' });

  const cards = await page.locator('[class*="wrapper"]').count();
  console.log('Cards in library after save:', cards);

  // Step 6: flip card
  if (cards > 0) {
    console.log('\n=== 6. Flip card ===');
    await page.locator('[class*="wrapper"]').first().click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_08_flipped.png' });
    const flipped = await page.locator('[class*="flipped"]').isVisible().catch(() => false);
    console.log('Card flipped:', flipped);
    const editBtn = page.locator('button[aria-label="Editar"]');
    console.log('Edit button visible on back:', await editBtn.isVisible().catch(() => false));
  }
}

// Step 7: probe — try wrong credentials
console.log('\n=== 7. Probe: login with wrong password ===');
await page.click('button[aria-label="Cerrar sesión"]');
await page.waitForTimeout(400);
await page.fill('#email', 'tester@vi.com');
await page.fill('#password', 'wrongpass');
await page.click('button[type="submit"]');
await page.waitForTimeout(600);
const loginError = page.locator('[role="alert"]');
const loginErrVisible = await loginError.isVisible().catch(() => false);
console.log('Error on wrong login:', loginErrVisible, loginErrVisible ? await loginError.textContent() : '');
await page.screenshot({ path: 'D:/Bere/GIT/VI/ss_09_login_error.png' });

console.log('\n=== Final API call summary ===');
apiCalls.forEach(c => console.log(' ', c.status, c.path.split('?')[0]));
console.log('\n=== App errors ===');
if (appErrors.length === 0) console.log('None');
else appErrors.forEach(e => console.log('ERR:', e));

await browser.close();
