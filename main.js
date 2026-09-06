/* ============================================================
   main.js  —  Content loader & site behaviour
   Reads config.js (already loaded in <head>) and all .txt files,
   then populates the DOM. Edit content via the .txt files only.
   ============================================================ */

// ── 1. Apply palette from config ────────────────────────────
(function applyPalette() {
  const p = SITE_CONFIG.palette;
  const root = document.documentElement.style;
  root.setProperty('--color-dark',        p.dark);
  root.setProperty('--color-teal',        p.teal);
  root.setProperty('--color-cream',       p.cream);
  root.setProperty('--color-light-cream', p.lightCream);
  root.setProperty('--color-white',       p.white);
  root.setProperty('--color-text-dark',   p.textDark);
  root.setProperty('--color-text-mid',    p.textMid);
  root.setProperty('--color-text-light',  p.textLight);
  root.setProperty('--color-accent',      p.accent);
})();

// ── 2. Populate nav & identity ───────────────────────────────
document.querySelector('.nav-logo').textContent = SITE_CONFIG.name;
document.title = SITE_CONFIG.name + ' · Academic Website';

const navList = document.querySelector('.nav-links');
SITE_CONFIG.nav.forEach(item => {
  const li = document.createElement('li');
  if (item.sub) {
    li.classList.add('has-dropdown');
    let subHtml = `<ul class="dropdown">`;
    item.sub.forEach(sub => {
      subHtml += `<li><a href="#${item.id}" data-tab-target="${sub.target}">${sub.label}</a></li>`;
    });
    subHtml += `</ul>`;
    li.innerHTML = `<a href="#${item.id}" class="nav-item-main">${item.label} <span style="font-size:0.7em; vertical-align:middle;">▼</span></a>${subHtml}`;
  } else {
    li.innerHTML = `<a href="#${item.id}" class="nav-item-main">${item.label}</a>`;
  }
  navList.appendChild(li);
});

// Switch tabs when a dropdown link is clicked
// Directly toggles active classes instead of relying on initTabs handlers,
// so it works even before async content has finished loading.
document.querySelectorAll('.dropdown a').forEach(a => {
  a.addEventListener('click', (e) => {
    setTimeout(() => {
      const targetId = a.getAttribute('data-tab-target');
      if (!targetId) return;
      const targetPanel = document.getElementById(targetId);
      if (!targetPanel) return;
      // Find the tab button and its sibling tabs/panels
      const tabBtn = document.querySelector(`button[data-target="${targetId}"]`);
      if (tabBtn) {
        const container = tabBtn.parentElement;
        // Determine the panel class from the target panel's classList
        const panelClass = Array.from(targetPanel.classList).find(c => c.endsWith('-panel'));
        if (container && panelClass) {
          // Deactivate all sibling tabs
          container.querySelectorAll('button[role="tab"]').forEach(t => t.classList.remove('active'));
          // Deactivate all sibling panels
          document.querySelectorAll('.' + panelClass).forEach(p => p.classList.remove('active'));
          // Activate the target
          tabBtn.classList.add('active');
          targetPanel.classList.add('active');
        }
      }
    }, 50);
  });
});

// Hamburger toggle
const navToggle = document.querySelector('.nav-toggle');
navList.classList.remove('open');
navToggle.addEventListener('click', () => navList.classList.toggle('open'));

// Close menu on link click (mobile)
navList.addEventListener('click', e => {
  if (e.target.tagName === 'A' && !e.target.classList.contains('nav-item-main')) {
    navList.classList.remove('open');
  } else if (e.target.tagName === 'A' && e.target.classList.contains('nav-item-main') && !e.target.parentElement.classList.contains('has-dropdown')) {
    navList.classList.remove('open');
  }
});

// ── 3. Fetch helper ─────────────────────────────────────────
async function fetchText(path) {
  const v = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.version) ? `?v=${SITE_CONFIG.version}` : `?rev=${Date.now()}`;
  const res = await fetch(path + v);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.text();
}

// ── 4. Simple markdown-lite parser ──────────────────────────
// Supports: **bold**, *italic*, line breaks, and inline pub-ref markers
function parseMini(text) {
  if (!text) return '';
  return text
    .replace(/\\\*/g, '&#42;')
    .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// Parse a .txt file into a map of { sectionKey: contentString }
function parseSections(raw) {
  const sections = {};
  const parts = raw.split(/^## /m);
  parts.forEach(part => {
    const lines = part.split(/\r?\n/);
    if (lines.length < 2) return;
    const key = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    if (key) sections[key] = body;
  });
  return sections;
}

// Parse repeated blocks (like ## pub, ## mentee, etc.)
function parseRepeatingBlocks(raw, key) {
  const entries = [];
  const regex = new RegExp(`^## ${key}$`, 'gm');
  const parts = raw.split(regex);
  parts.forEach((block, i) => {
    if (i === 0 && !block.startsWith('\n')) return; // skip preamble
    // Cut off the block at the next header to avoid parsing subsequent sections
    const actualBlock = block.split(/^## /m)[0];
    const lines = actualBlock.trim().split('\n');
    const entry = {};
    lines.forEach(line => {
      const col = line.indexOf(':');
      if (col !== -1) {
        const k = line.slice(0, col).trim();
        const v = line.slice(col + 1).trim();
        if (k) entry[k] = v;
      }
    });
    if (Object.keys(entry).length) entries.push(entry);
  });
  return entries;
}

// Parse ### sub-headers within a section into items
function parseSubitems(text) {
  const items = [];
  const parts = text.split(/^### /m);
  parts.forEach((part, i) => {
    if (i === 0) return;
    const nl = part.indexOf('\n');
    const heading = part.slice(0, nl).trim();
    const body = part.slice(nl + 1).trim();
    items.push({ heading, body });
  });
  return items;
}

// ── 5. Hero / Home ──────────────────────────────────────────
async function loadHome() {
  const raw = await fetchText('content/home.txt');
  const s = parseSections(raw);

  document.getElementById('hero-name').textContent  = SITE_CONFIG.name;
  document.getElementById('hero-tagline').textContent = SITE_CONFIG.tagline;
  document.getElementById('hero-headline').innerHTML  = parseMini(s.headline   || '');
  document.getElementById('hero-bio').innerHTML       = parseMini(s.bio        || '').replace(/<br><br>/g, '</p><p>');
  document.getElementById('hero-callout').textContent = s.callout || '';

  // Email link
  document.getElementById('hero-email').href = `mailto:${SITE_CONFIG.email}`;
  document.getElementById('hero-email').title = SITE_CONFIG.email;

  // Socials
  const socials = [
    { id: 'social-scholar',  href: SITE_CONFIG.scholar,  label: 'Scholar' },
    { id: 'social-linkedin', href: SITE_CONFIG.linkedin, label: 'LinkedIn' },
    { id: 'social-github',   href: SITE_CONFIG.github,   label: 'GitHub' },
  ];
  socials.forEach(({ id, href, label }) => {
    const el = document.getElementById(id);
    if (el) { el.href = href; el.querySelector('.social-label').textContent = label; }
  });
}

// ── 6. About ────────────────────────────────────────────────
async function loadAbout() {
  const raw = await fetchText('content/about.txt');
  const s = parseSections(raw);
  const extEl = document.getElementById('extracurriculars-text');

  // Education timeline
  const timelineEl = document.getElementById('edu-timeline');
  if (timelineEl && s.education) {
    const items = parseSubitems(s.education);
    timelineEl.innerHTML = items.map(({ heading, body }) => {
      const lines = body.split(/\r?\n/).filter(Boolean);
      const degree = lines[0] ? parseMini(lines[0]) : '';
      const institution = lines[1] ? lines[1] : '';
      const grade = lines[2] ? lines[2] : '';
      return `
        <div class="timeline-item reveal">
          <div class="timeline-year">${heading}</div>
          <div class="timeline-body">
            <h4>${degree}</h4>
            <p>${institution}</p>
            ${grade ? `<p class="timeline-grade">${grade}</p>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  // Distinctions
  const distEl = document.getElementById('distinctions-list');
  if (distEl && s.distinctions) {
    const items = parseSubitems(s.distinctions);
    distEl.innerHTML = items.map(({ heading, body }) => `
      <li class="distinction-item reveal">
        <span class="distinction-year">${heading}</span>
        <span class="distinction-text">${parseMini(body.trim())}</span>
      </li>`).join('');
  }

  // Extracurriculars
  if (extEl && s.extracurriculars) {
    extEl.innerHTML = s.extracurriculars.split(/\r?\n\r?\n/).map(p => {
      return `<p>${parseMini(p.trim())}</p>`;
    }).join('');
  }
}

// ── 7. Research ─────────────────────────────────────────────

// Parse key:value fields from a project block.
// Recognised keys: category, image, description, keywords, ref
// 'ref' can appear multiple times and is collected into an array.
function parseProjectFields(text) {
  const fields = { refs: [] };
  const knownKeys = ['category', 'image', 'description', 'keywords', 'ref'];
  let currentKey = null;
  let currentVal = [];

  function flush() {
    if (!currentKey) return;
    const val = currentVal.join(' ').replace(/\s+/g, ' ').trim();
    if (currentKey === 'ref') { if (val) fields.refs.push(val); }
    else { fields[currentKey] = val; }
  }

  for (const line of text.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)/);
    if (m && knownKeys.includes(m[1])) {
      flush();
      currentKey = m[1];
      currentVal = m[2] ? [m[2]] : [];
    } else if (currentKey) {
      currentVal.push(line);
    }
  }
  flush();
  return fields;
}

// Make bare URLs in text into clickable links.
function linkifyUrls(text) {
  return text.replace(/(?<!=["'])(https?:\/\/[^\s<"]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

// Category → colour class mapping
const CATEGORY_CLASS = {
  'biological application': 'cat-bio',
  'database':               'cat-db',
  'tool':                   'cat-tools',
};

async function loadResearch() {
  const raw = await fetchText('content/research_phd.txt');

  // Intro
  const introEl = document.getElementById('research-intro');
  const introMatch = raw.match(/^## intro\n([\s\S]*?)(?=\n## )/m);
  if (introEl && introMatch) {
    introEl.innerHTML = introMatch[1].trim()
      .split('\n\n')
      .map(p => `<p>${parseMini(p)}</p>`)
      .join('');
  }

  // Projects
  const projectsEl = document.getElementById('research-projects');
  if (!projectsEl) return;

  const parts = raw.split(/^## project_\d+\s*$/m);
  const cards = [];

  parts.forEach((block, i) => {
    if (i === 0) return;
    block = block.trim();

    const titleMatch = block.match(/^### (.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) return;

    const fields = parseProjectFields(block.replace(/^### .+\n?/m, ''));

    // Category badge
    const catKey = (fields.category || '').toLowerCase();
    const catClass = CATEGORY_CLASS[catKey] || 'cat-other';
    const categoryBadge = fields.category
      ? `<span class="category-badge ${catClass}">${fields.category}</span>`
      : '';

    // Image
    const imgHtml = fields.image
      ? `<div class="research-card-image"><img src="${fields.image}" alt="${title} figure" loading="lazy"></div>`
      : '';

    // Description
    const descHtml = fields.description
      ? `<p class="research-card-desc">${linkifyUrls(parseMini(fields.description))}</p>`
      : '';

    // Keyword chips
    const kwHtml = fields.keywords
      ? `<div class="keyword-chips">${
          fields.keywords.split('·').map(k => k.trim()).filter(Boolean)
            .map(k => `<span class="keyword-chip">${k}</span>`).join('')
        }</div>`
      : '';

    // References
    const refsHtml = fields.refs.length
      ? `<div class="pub-refs">${
          fields.refs.map(r => `<div class="pub-ref">${parseMini(r)}</div>`).join('')
        }</div>`
      : '';

    cards.push(`
      <div class="research-card reveal">
        <div class="research-card-header">
          <h3>${title}</h3>
          ${categoryBadge}
        </div>
        ${imgHtml}
        ${descHtml}
        ${kwHtml}
        ${refsHtml}
      </div>`);
  });

  projectsEl.innerHTML = cards.join('');
}

// ── 7b. Pre-PhD Research ─────────────────────────────────────
async function loadPrePhd() {
  const raw = await fetchText('content/research_prephd.txt');

  // Intro
  const introEl = document.getElementById('prephd-intro');
  const s = parseSections(raw);
  if (introEl && s.intro) {
    introEl.innerHTML = s.intro.split('\n\n').map(p => `<p>${parseMini(p)}</p>`).join('');
  }

  // Projects (rotation_ and internship_)
  const projectsEl = document.getElementById('prephd-projects');
  if (!projectsEl) return;

  const parts = raw.split(/^## (?:rotation_|internship_)\d+/m);
  const cards = [];

  parts.forEach((block, i) => {
    if (i === 0) return;
    block = block.trim();
    const titleMatch = block.match(/^### (.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) return;

    const rest = block.replace(/^### .+\n?/m, '');
    const paragraphs = rest.split('\n\n');
    const desc = paragraphs
      .filter(x => !x.startsWith('**Publication'))
      .map(x => parseMini(x)).join('<br><br>');
    const refs = paragraphs
      .filter(x => x.startsWith('**Publication'))
      .map(x => `<div class="pub-ref">${parseMini(x)}</div>`).join('');

    cards.push(`
      <div class="research-card reveal">
        <div class="research-card-header">
          <h3>${title}</h3>
        </div>
        <p class="research-card-desc">${desc}</p>
        ${refs ? `<div class="pub-refs">${refs}</div>` : ''}
      </div>`);
  });

  projectsEl.innerHTML = cards.join('');
}

// ── 8. Publications ──────────────────────────────────────────
async function loadPublications() {
  const raw = await fetchText('content/publications.txt');
  const s = parseSections(raw);
  const noteEl = document.getElementById('pub-note');
  if (noteEl && s.note) noteEl.innerHTML = parseMini(s.note);

  const pubs = parseRepeatingBlocks(raw, 'pub');
  const inpreps = parseRepeatingBlocks(raw, 'inprep');

  const pubListEl = document.getElementById('pub-list');
  if (!pubListEl) return;

  let html = '';
  pubs.forEach((pub, i) => {
    const badge = pub.type ? `<span class="pub-badge">${pub.type}</span>` : '';
    const linkBtn = pub.link ? `<div style="margin-top: 0.6rem;"><a href="${pub.link}" target="_blank" rel="noopener" class="pub-btn">Link to publication<span style="font-size: 0.85em; margin-left: 4px; display: inline-block;">↗</span></a></div>` : '';
    html += `
      <div class="pub-entry reveal">
        <span class="pub-num">${i + 1}</span>
        <div>
          <div class="pub-title">${parseMini(pub.title || '')}${badge}</div>
          <div class="pub-authors">${parseMini(pub.authors || '')}</div>
          <div class="pub-journal">${pub.journal || ''}${pub.year ? ' · ' + pub.year : ''}</div>
          ${linkBtn}
        </div>
      </div>`;
  });

  if (inpreps.length) {
    html += `<p class="pub-section-label">Manuscripts in preparation</p>`;
    inpreps.forEach(pub => {
      html += `
        <div class="pub-entry reveal">
          <span class="pub-num">—</span>
          <div>
            <div class="pub-title">${parseMini(pub.title || '')}<span class="pub-badge inprep">In prep</span></div>
            <div class="pub-authors">${parseMini(pub.authors || '')}</div>
          </div>
        </div>`;
    });
  }

  pubListEl.innerHTML = html;
}

// ── 9. Outreach ──────────────────────────────────────────────
async function loadOutreach() {
  const [teachRaw, presRaw] = await Promise.all([
    fetchText('content/outreach_teaching.txt'),
    fetchText('content/outreach_presentations.txt'),
  ]);

  const teach = parseSections(teachRaw);

  // Teaching highlight
  const teachEl = document.getElementById('teaching-highlight');
  if (teachEl && teach.teaching) {
    const items = parseSubitems(teach.teaching);
    if (items.length) {
      const { heading, body } = items[0];
      const lines = body.split('\n');
      const textLines = [];
      const actionLines = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('btn-blue: ')) {
          actionLines.push({ type: 'btn-blue', text: trimmed.replace(/^btn-blue:\s*/, '') });
        } else if (trimmed.startsWith('btn-grey: ')) {
          actionLines.push({ type: 'btn-grey', text: trimmed.replace(/^btn-grey:\s*/, '') });
        } else {
          textLines.push(line);
        }
      });
      const bodyHtml = parseMini(textLines.join('\n'));
      const actionsHtml = actionLines.length
        ? `<div class="pres-actions" style="margin-top: 0.75rem; display: flex; gap: 0.6rem; flex-wrap: wrap;">
            ${actionLines.map(a => parseMini(a.text).replace('<a ', `<a class="pres-btn ${a.type}" `)).join('')}
           </div>`
        : '';
      teachEl.innerHTML = `<strong>${heading}</strong><br>${bodyHtml}${actionsHtml}`;
    }
  }

  // Mentees
  const menteesIntroEl = document.getElementById('mentees-intro');
  const menteesGridEl = document.getElementById('mentees-grid');
  if (menteesIntroEl && teach.mentoring_intro) {
    menteesIntroEl.innerHTML = parseMini(teach.mentoring_intro);
  }
  if (menteesGridEl) {
    const mentees = parseRepeatingBlocks(teachRaw, 'mentee');
    menteesGridEl.innerHTML = mentees.map(m => `
      <div class="mentee-card reveal">
        <div class="mentee-name">${m.name || ''}</div>
        <div class="mentee-role">${m.role || ''}</div>
        <div class="mentee-project">${parseMini(m.project || '')}</div>
        ${m.note ? `<div class="mentee-note">${parseMini(m.note)}</div>` : ''}
      </div>`).join('');
  }

  // Presentations
  const pres = parseSections(presRaw);
  const postersEl = document.getElementById('posters-list');
  if (postersEl && pres.posters) {
    const items = parseSubitems(pres.posters);
    postersEl.innerHTML = items.map(({ heading, body }) => {
      const posters = body.split(/\n\s*\n/).filter(Boolean);
      return posters.map(poster => {
        const lines = poster.split('\n');
        const titleLine = lines[0];
        const metaLines = [];
        const actionLines = [];
        lines.slice(1).forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('btn-blue: ')) {
            actionLines.push({ type: 'btn-blue', text: trimmed.replace(/^btn-blue:\s*/, '') });
          } else if (trimmed.startsWith('btn-grey: ')) {
            actionLines.push({ type: 'btn-grey', text: trimmed.replace(/^btn-grey:\s*/, '') });
          } else if (trimmed) {
            metaLines.push(line);
          }
        });
        const metaHtml = `<span class="pres-meta">${heading} · ${metaLines.join(' ')}</span>`;
        const actionsHtml = actionLines.length
          ? `<div class="pres-actions" style="margin-top: 0.75rem; display: flex; gap: 0.6rem; flex-wrap: wrap;">
              ${actionLines.map(a => parseMini(a.text).replace('<a ', `<a class="pres-btn ${a.type}" `)).join('')}
             </div>`
          : '';
        return `
          <li class="pres-item reveal">
            <strong>${parseMini(titleLine)}</strong>
            ${metaHtml}
            ${actionsHtml}
          </li>`;
      }).join('');
    }).join('');
  }

  const talksEl = document.getElementById('talks-list');
  if (talksEl && pres.talks) {
    const groups = parseSubitems(pres.talks);
    talksEl.innerHTML = groups.map(({ heading, body }) => {
      // Split entries by newline followed by a dash. Handle first entry carefully.
      const rawEntries = body.split(/\n\s*-\s+/).filter(Boolean);
      const entries = rawEntries.map((e, i) => (i === 0) ? e.replace(/^-\s+/, '') : e);

      const groupId = 'talk-group-' + heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      return `
        <div class="pres-group reveal" id="${groupId}">
          <h3>${heading}</h3>
          <ul class="pres-list">
            ${entries.map(e => {
              const lines = e.split(/\r?\n/);
              const regularLines = [];
              const refLines = [];
              const actionLines = [];
              
              lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('ref: ')) {
                  refLines.push(trimmed.replace(/^ref:\s*/, ''));
                } else if (trimmed.startsWith('btn-blue: ')) {
                  actionLines.push({ type: 'btn-blue', text: trimmed.replace(/^btn-blue:\s*/, '') });
                } else if (trimmed.startsWith('btn-grey: ')) {
                  actionLines.push({ type: 'btn-grey', text: trimmed.replace(/^btn-grey:\s*/, '') });
                } else if (trimmed) {
                  regularLines.push(line);
                }
              });

              const content = parseMini(regularLines.join('\n'));
              const actionsHtml = actionLines.length
                ? `<div class="pres-actions" style="margin-top: 0.75rem; display: flex; gap: 0.6rem; flex-wrap: wrap;">
                    ${actionLines.map(a => parseMini(a.text).replace('<a ', `<a class="pres-btn ${a.type}" `)).join('')}
                   </div>`
                : '';
              const refsHtml = refLines.length
                ? `<div class="pub-refs" style="margin-top:0.8rem;">
                    ${refLines.map(r => `<div class="pub-ref">${parseMini(r)}</div>`).join('')}
                   </div>`
                : '';
              
              return `<li class="pres-item">${content}${actionsHtml}${refsHtml}</li>`;
            }).join('')}
          </ul>
        </div>`;
    }).join('');
  }
}

// ── 10. Community ─────────────────────────────────────────────
async function loadCommunity() {
  const raw = await fetchText('content/community.txt');
  const s = parseSections(raw);

  const aboutEl = document.getElementById('pjc-about');
  if (aboutEl && s.pjc_about) aboutEl.innerHTML = parseMini(s.pjc_about);

  const postersEl = document.getElementById('pjc-posters');
  if (postersEl && s.pjc_posters) {
    postersEl.innerHTML = s.pjc_posters.split(/\r?\n/).filter(Boolean).map(src => {
      return `<img src="${src.trim()}" alt="PJC Poster" loading="lazy" />`;
    }).join('');
  }

  const talksRedirEl = document.getElementById('pjc-talks-redirect');
  if (talksRedirEl && s.pjc_talks_redirect) talksRedirEl.innerHTML = parseMini(s.pjc_talks_redirect);

  const sessionsEl = document.getElementById('pjc-sessions-table');
  if (sessionsEl && s.pjc_curated_sessions) {
    const lines = s.pjc_curated_sessions.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const headers = lines[0].split(',');
      const rows = lines.slice(1);
      
      let html = '<table class="pjc-table"><thead><tr>';
      headers.forEach(h => html += `<th>${parseMini(h.trim())}</th>`);
      html += '</tr></thead><tbody>';
      
      rows.forEach(row => {
        const cols = [];
        let inQuotes = false;
        let value = '';
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(value.trim());
            value = '';
          } else {
            value += char;
          }
        }
        cols.push(value.trim());

        html += '<tr>';
        cols.forEach(c => {
          html += `<td>${parseMini(c)}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      sessionsEl.innerHTML = html;
    }
  }

  const roleEl = document.getElementById('leadership-roles');
  if (roleEl && s.leadership_roles) {
    const items = parseSubitems(s.leadership_roles);
    roleEl.innerHTML = items.map(({ heading, body }) => `
      <div class="pjc-block reveal">
        <h4>${heading}</h4>
        <p>${parseMini(body)}</p>
      </div>`).join('');
  }
}

// ── 11. Tab switching (shared) ───────────────────────────────
function initTabs(groupClass, tabClass, panelClass) {
  const container = document.querySelector('.' + groupClass);
  if (!container) return;
  container.querySelectorAll('.' + tabClass).forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.' + tabClass).forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.' + panelClass).forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add('active');
    });
  });
}

// ── 12. Active nav on scroll ────────────────────────────────
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');
  const observer  = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
}

// ── 13. Scroll-reveal ───────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Observe elements already in DOM, and use a MutationObserver
  // to catch dynamically-added .reveal elements
  const observe = el => observer.observe(el);
  document.querySelectorAll('.reveal').forEach(observe);

  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (node.classList.contains('reveal')) observe(node);
        node.querySelectorAll && node.querySelectorAll('.reveal').forEach(observe);
      }
    }));
  }).observe(document.body, { childList: true, subtree: true });
}

// ── 14. Bootstrap ───────────────────────────────────────────
async function init() {
  try {
    await Promise.all([
      loadHome(),
      loadAbout(),
      loadResearch(),
      loadPrePhd(),
      loadPublications(),
      loadOutreach(),
      loadCommunity(),
    ]);
  } catch (err) {
    console.warn('Content load error:', err);
  }

  initTabs('research-tabs', 'research-tab', 'research-panel');
  initTabs('outreach-tabs', 'outreach-tab', 'outreach-panel');
  initTabs('community-tabs', 'community-tab', 'community-panel');
  initScrollSpy();
  initReveal();
}

document.addEventListener('DOMContentLoaded', init);
