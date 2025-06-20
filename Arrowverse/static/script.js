/* ------------------------------------------------------------------ *
 * 1.  CONFIGURATION
 * ------------------------------------------------------------------ */
let order = true; // Change to false to disable order enforcement

const COOKIE_ORDERED = 'checkedCountOrdered';
const COOKIE_UNORDERED = 'checkedCountUnordered';
const COOKIE_ORDER_ENABLED = 'orderEnabled';

/* ------------------------------------------------------------------ *
 * 2.  COOKIE HELPERS
 * ------------------------------------------------------------------ */
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  setCookie(name, "", -1);
}

/* ------------------------------------------------------------------ *
 * 3.  POPUP FOR ORDER ENFORCEMENT
 * ------------------------------------------------------------------ */
function showPopup(msg) {
  document.getElementById('order-popup')?.remove();
  const wrapper = document.createElement('div');
  wrapper.id = 'order-popup';
  wrapper.style.cssText = `
    position:fixed;inset:0;display:flex;align-items:center;
    justify-content:center;z-index:1055;background:rgba(0,0,0,.35)
  `;
  wrapper.innerHTML = `
    <div class="bg-white rounded shadow p-4 text-center" style="max-width:22rem;">
      <p class="mb-3">${msg}</p>
      <button class="btn btn-primary" id="order-close">OK</button>
    </div>
  `;
  document.body.appendChild(wrapper);
  document.getElementById('order-close').addEventListener('click', () => wrapper.remove());
}

/* ------------------------------------------------------------------ *
 * 4.  COUNT & SAVE CHECKED BOXES
 * ------------------------------------------------------------------ */
function countCheckedCheckboxes() {
  const checkedIndices = Array.from(document.querySelectorAll('.checkbox-group'))
    .map((cb, idx) => cb.checked ? idx : -1)
    .filter(i => i >= 0);

  // Save to appropriate cookie based on order mode
  const cookieName = order ? COOKIE_ORDERED : COOKIE_UNORDERED;
  setCookie(cookieName, JSON.stringify(checkedIndices), 999999);
  console.log(`Checked episodes indices (${order ? 'ordered' : 'unordered'}): [${checkedIndices.join(', ')}]`);
}

// Load checked indices from appropriate cookie based on order mode
function loadCheckedIndices() {
  const cookieName = order ? COOKIE_ORDERED : COOKIE_UNORDERED;
  const json = getCookie(cookieName);
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

// Save order mode enabled/disabled to cookie
function saveOrderEnabled() {
  setCookie(COOKIE_ORDER_ENABLED, order ? 'true' : 'false', 999999);
}

// Load order mode from cookie
function loadOrderEnabled() {
  const val = getCookie(COOKIE_ORDER_ENABLED);
  return val === 'false' ? false : true; // default true
}

/* ------------------------------------------------------------------ *
 * 5.  ORDER TOGGLE
 * ------------------------------------------------------------------ */
function toggleOrder() {
  // Save current checked indices into current mode cookie before switching
  countCheckedCheckboxes();

  // Toggle mode
  order = !order;

  // Save mode cookie
  saveOrderEnabled();

  // Update button label
  updateToggleButtonLabel();

  // Reload checked states from other cookie
  const checkedIndices = loadCheckedIndices();

  // Re-render to update checkboxes with new cookie's data
  renderEpisodes(filteredEpisodes);

  // Scroll to last watched if order ON
  if(order) scrollToLastWatched();
}

function updateToggleButtonLabel() {
  const btn = document.getElementById('order-toggle-btn');
  const scrollBtn = document.getElementById('scroll-last-btn');
  if (!btn || !scrollBtn) return;

  btn.textContent = order ? 'Turn Off Order' : 'Turn On Order';
  btn.setAttribute('aria-pressed', order ? 'true' : 'false');
  scrollBtn.style.display = order ? 'inline-block' : 'none';
}

/* ------------------------------------------------------------------ *
 * 6.  SCROLL TO LAST WATCHED
 * ------------------------------------------------------------------ */
function scrollToLastWatched() {
  if (!order) return;

  const checkedIndices = loadCheckedIndices();
  if (!checkedIndices.length) {
    showPopup('No episodes have been watched yet.');
    return;
  }

  const lastIndex = Math.max(...checkedIndices);
  const targetRow = document.querySelector(`.row-number-${lastIndex}`);

  if (targetRow) {
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetRow.classList.add('highlight-row');
    setTimeout(() => targetRow.classList.remove('highlight-row'), 2000);
  } else {
    showPopup('Last watched episode not found.');
  }
}

/* ------------------------------------------------------------------ *
 * 7.  FILTERING FUNCTIONS
 * ------------------------------------------------------------------ */
let allEpisodes = [];
let filteredEpisodes = [];

function populateSeriesFilter(seriesList) {
  const select = document.getElementById('filter-series');
  select.innerHTML = '<option value="">All Series</option>';
  seriesList.forEach(series => {
    const opt = document.createElement('option');
    opt.value = series;
    opt.textContent = series;
    select.appendChild(opt);
  });
}

function populateSeasonFilter(seasons) {
  const select = document.getElementById('filter-season');
  select.innerHTML = '<option value="">All Seasons</option>';
  seasons.forEach(season => {
    const opt = document.createElement('option');
    opt.value = season;
    opt.textContent = season;
    select.appendChild(opt);
  });
  select.disabled = seasons.length === 0;
}

function filterEpisodes() {
  const series = document.getElementById('filter-series').value;
  const season = document.getElementById('filter-season').value;
  const episodeText = document.getElementById('filter-episode').value.trim();

  filteredEpisodes = allEpisodes.filter(ep => {
    if (series && ep.Series !== series) return false;
    if (season && String(ep.Season) !== season) return false;
    if (episodeText && !String(ep.Episode).includes(episodeText)) return false;
    return true;
  });

  renderEpisodes(filteredEpisodes);
}

function clearFilters() {
  document.getElementById('filter-series').value = '';
  document.getElementById('filter-season').value = '';
  document.getElementById('filter-season').disabled = true;
  document.getElementById('filter-episode').value = '';
  filteredEpisodes = [...allEpisodes];
  renderEpisodes(filteredEpisodes);
}

/* ------------------------------------------------------------------ *
 * 8.  RENDERING EPISODES
 * ------------------------------------------------------------------ */
function renderEpisodes(episodes) {
  const container = document.getElementById('content');
  container.innerHTML = '';

  const checkedIndices = loadCheckedIndices();

  episodes.forEach((ep, i) => {
    // Determine checked state by presence in cookie indices
    const originalIndex = allEpisodes.indexOf(ep);
    const isChecked = checkedIndices.includes(originalIndex);

    const div = document.createElement('div');
    div.className = `row w-100 align-items-center p-1 row-number-${originalIndex}`;

    div.innerHTML = `
      <div class="col-sm-1 col-lg-1 border-end d-flex align-items-center">
        <input class="form-check-input checkbox-group" type="checkbox" id="flexCheck-${originalIndex}" data-index="${originalIndex}" ${isChecked ? 'checked' : ''}>
      </div>
      <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
        <p class="mb-0">${ep.Series}</p>
      </div>
      <div class="col-sm-3 col-lg-3 border-end d-flex align-items-center">
        <p class="mb-0">S${ep.Season} E${ep.Episode}</p>
      </div>
      <div class="col-sm-3 col-lg-3 border-end d-flex text-center align-items-center">
        <p class="mb-0">${ep.Title}</p>
      </div>
      <div class="col-sm-2 col-lg-2 border-end d-flex align-items-center">
        <button class="btn btn-primary btn-sm" onclick="window.open('${ep.WatchURL}', '_blank')">Watch</button>
      </div>
    `;

    container.appendChild(div);
  });

  addCheckboxListeners();
}

/* ------------------------------------------------------------------ *
 * 9.  ADD CHECKBOX LISTENERS WITH ORDER ENFORCEMENT
 * ------------------------------------------------------------------ */
function addCheckboxListeners() {
  const checkboxes = document.querySelectorAll('.checkbox-group');
  checkboxes.forEach(cb => {
    cb.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.index, 10);
      const checkedBoxes = document.querySelectorAll('.checkbox-group:checked');
      const totalChecked = checkedBoxes.length;

      if (order && e.target.checked) {
        // Enforce order: only allow checking next episode in sequence
        const checkedIndices = loadCheckedIndices();
        const maxChecked = checkedIndices.length ? Math.max(...checkedIndices) : -1;
        if (idx !== maxChecked + 1) {
          e.target.checked = false;
          showPopup(
            "You must watch episodes in order.\nSet 'order' to false to disable this check."
          );
          return;
        }
      }

      countCheckedCheckboxes();
    });
  });
}

/* ------------------------------------------------------------------ *
 * 10.  INITIALIZATION & DATA LOADING
 * ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  order = loadOrderEnabled();
  updateToggleButtonLabel();

  fetch('./static/data.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch JSON file');
      return res.json();
    })
    .then(data => {
      allEpisodes = data.Episodes.map(ep => ({
        ...ep,
        WatchURL: data.Series[ep.Series] || '#',
      }));
      filteredEpisodes = [...allEpisodes];

      const uniqueSeries = [...new Set(allEpisodes.map(ep => ep.Series))];
      populateSeriesFilter(uniqueSeries);

      renderEpisodes(filteredEpisodes);

      document.getElementById('filter-series').addEventListener('change', () => {
        const selectedSeries = document.getElementById('filter-series').value;
        if (!selectedSeries) {
          document.getElementById('filter-season').disabled = true;
          document.getElementById('filter-season').innerHTML = '<option value="">All Seasons</option>';
        } else {
          const seasonsForSeries = [...new Set(
            allEpisodes.filter(ep => ep.Series === selectedSeries).map(ep => ep.Season)
          )].sort((a,b) => a-b);
          populateSeasonFilter(seasonsForSeries);
          document.getElementById('filter-season').disabled = false;
        }
        filterEpisodes();
      });

      document.getElementById('filter-season').addEventListener('change', filterEpisodes);
      document.getElementById('filter-episode').addEventListener('input', filterEpisodes);
      document.getElementById('clear-filters').addEventListener('click', clearFilters);
    })
    .catch(err => {
      console.error('Error:', err);
      showPopup('Error loading episode data. Please try again later.');
    });
});

// Make functions global for inline handlers
window.toggleOrder = toggleOrder;
window.scrollToLastWatched = scrollToLastWatched;
