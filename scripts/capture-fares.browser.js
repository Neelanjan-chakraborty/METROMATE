/*
 * Capture GMRC's fare-calculator answers for every pair of stations.
 *
 * HOW TO RUN (in YOUR browser, as a normal visitor):
 *   1. Open https://www.gujaratmetrorail.com/ahmedabad/route-and-fares/
 *   2. Open DevTools -> Console, paste this whole file, press Enter.
 *   3. Leave the tab open. It asks the page's own calculator one pair at a time
 *      (the same request the page makes when you press "Get fare") and downloads
 *      gmrc-fares-capture.json when finished. Stop early any time with:  window.__stopFares = true
 *   4. Put that file in the repo and run:  node scripts/import-fares.mjs gmrc-fares-capture.json
 *
 * BE CONSIDERATE: it sends about one request per second (~1,450 requests, about 25 minutes)
 * and aborts if the site starts refusing requests. Run it once, off-peak, and keep the output.
 * Check the site's terms, or ask GMRC, if you plan to repeat it. Nothing here bypasses a login
 * or any protection; if the site asks for a captcha or blocks you, stop.
 *
 * Set QUICK_TEST to true first to try just 6 stations (15 requests).
 */
(async () => {
  const QUICK_TEST = false;
  const DELAY_MS = 1000;
  const REVERSE_SAMPLES = 25; // extra reversed pairs, to prove whether fares are the same both ways
  const ENDPOINT = '/ahmedabad/wp-admin/admin-ajax.php';

  const find = (name) => document.querySelector(`select[name="${name}"], select#${name}, #${name}`);
  const fromSel = find('FromStation');
  const toSel = find('ToStation');
  if (!fromSel || !toSel || !fromSel.options) {
    console.error('Could not find the FromStation / ToStation dropdowns. Are you on the route-and-fares page?');
    return;
  }
  let stations = [...fromSel.options]
    .filter((o) => o.value && o.value.trim() !== '' && !/^(select|choose|--)/i.test(o.text.trim()))
    .map((o) => ({ id: o.value.trim(), name: o.text.trim() }));
  if (QUICK_TEST) stations = stations.slice(0, 6);
  console.log(`Found ${stations.length} stations:`, stations.map((s) => `${s.id}=${s.name}`).join(', '));

  const pairs = [];
  for (let i = 0; i < stations.length; i++) for (let j = i + 1; j < stations.length; j++) pairs.push([stations[i].id, stations[j].id]);
  const shuffled = [...pairs].sort(() => Math.random() - 0.5).slice(0, REVERSE_SAMPLES);
  for (const [a, b] of shuffled) pairs.push([b, a]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const results = [];
  let failures = 0;
  window.__stopFares = false;

  for (let n = 0; n < pairs.length; n++) {
    if (window.__stopFares) {
      console.warn('Stopped by you.');
      break;
    }
    const [from, to] = pairs[n];
    try {
      const resp = await fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
        body: new URLSearchParams({ action: 'get_fare', FromStation: from, ToStation: to }).toString(),
      });
      if (resp.status === 429 || resp.status === 403) throw new Error(`HTTP ${resp.status} (the site is refusing requests)`);
      const res = await resp.json();
      results.push({ from, to, res });
      failures = 0;
    } catch (e) {
      failures++;
      console.warn(`Pair ${from}->${to} failed:`, e.message);
      if (failures >= 3) {
        console.error('Three failures in a row: stopping so as not to hammer the site.');
        break;
      }
    }
    if ((n + 1) % 25 === 0) console.log(`${n + 1}/${pairs.length} done`);
    await sleep(DELAY_MS);
  }

  const capture = { capturedAt: new Date().toISOString(), source: location.href, stations, results };
  window.__faresCapture = capture;
  const blob = new Blob([JSON.stringify(capture, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gmrc-fares-capture.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`Done: ${results.length} answers captured. The file was downloaded (also in window.__faresCapture).`);
})();
