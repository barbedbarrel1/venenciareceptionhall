// ============================================================
// VENECIA — admin.js
// Sections: auth · tabs · toast/modal helpers · dashboard ·
// clients + payments · inquiries · settings (packages, gallery)
// ============================================================

const loginScreen = document.getElementById('loginScreen');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

/* ---------------- auth ---------------- */
async function boot() {
  if (!db) {
    loginError.textContent = 'Supabase is not configured yet — add your project URL and anon key to config.js.';
    return;
  }
  const { data: { session } } = await db.auth.getSession();
  if (session) showApp(session); else showLogin();
}

function showLogin() {
  loginScreen.style.display = 'flex';
  app.style.display = 'none';
}

function showApp(session) {
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  document.getElementById('userGreeting').textContent = 'Hola, ' + (session.user.email || '').split('@')[0];
  loadDashboard();
  refreshInqBadge();
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';
  const submitBtn = loginForm.querySelector('button[type=submit]');
  submitBtn.disabled = true;

  const { data, error } = await db.auth.signInWithPassword({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value
  });

  submitBtn.disabled = false;
  if (error) { loginError.textContent = 'Incorrect email or password.'; return; }
  showApp(data.session);
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await db.auth.signOut();
  showLogin();
});

boot();

/* ---------------- tabs ---------------- */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('view-' + tab.dataset.view).classList.add('active');

    if (tab.dataset.view === 'dashboard') loadDashboard();
    if (tab.dataset.view === 'clients') loadClients();
    if (tab.dataset.view === 'inquiries') loadInquiries();
    if (tab.dataset.view === 'settings') { loadPackagesAdmin(); loadGalleryAdmin(); }
  });
});

/* ---------------- toast + modal helpers ---------------- */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalBg').classList.add('open');
  const cancel = document.getElementById('modalCancel');
  if (cancel) cancel.addEventListener('click', closeModal);
}
function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
  document.getElementById('modalContent').innerHTML = '';
}
document.getElementById('modalBg').addEventListener('click', e => {
  if (e.target.id === 'modalBg') closeModal();
});

/* ---------------- formatting helpers ---------------- */
function money(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// event_date/paid_at come back as 'YYYY-MM-DD' — parse as local time to avoid a day-early shift
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
const EVENT_TYPES = { wedding: 'Wedding', quinceanera: 'Quinceañera', sweet16: 'Sweet 16', baptism: 'Baptism', graduation: 'Graduation', other: 'Other' };
function eventTypeLabel(t) { return EVENT_TYPES[t] || (t || '—'); }

function clientStatusPill(status) {
  const map = { active: 'new', completed: 'paid', cancelled: 'muted' };
  return `<span class="pill ${map[status] || 'muted'}">${status}</span>`;
}
function inqStatusPill(status) {
  const map = { new: 'new', contacted: 'partial', booked: 'paid', lost: 'muted' };
  return `<span class="pill ${map[status] || 'muted'}">${status}</span>`;
}
function balancePill(row) {
  if (Number(row.balance_owed) <= 0) return `<span class="pill paid">Paid</span>`;
  if (Number(row.total_paid) > 0) return `<span class="pill partial">${money(row.balance_owed)} owed</span>`;
  return `<span class="pill due">${money(row.balance_owed)} owed</span>`;
}

/* ---------------- dashboard ---------------- */
async function loadDashboard() {
  const { data: balances, error: balErr } = await db.from('client_balances').select('*');
  const { data: payments, error: payErr } = await db.from('payments').select('amount, paid_at, type');
  if (balErr || payErr) { toast('Could not load dashboard data.'); return; }

  const rows = balances || [];
  // credits don't move real cash (README: "no cash changed hands") — exclude them from collected totals
  const pays = (payments || []).filter(p => p.type !== 'credit');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const collectedMonth = pays.filter(p => new Date(p.paid_at) >= monthStart).reduce((s, p) => s + Number(p.amount), 0);
  const collectedYear = pays.filter(p => new Date(p.paid_at) >= yearStart).reduce((s, p) => s + Number(p.amount), 0);
  const active = rows.filter(r => r.status === 'active');
  // money still coming in from booked events that haven't happened yet
  const projected = active
    .filter(r => r.event_date && new Date(r.event_date + 'T00:00:00') >= now)
    .reduce((s, r) => s + Math.max(0, Number(r.balance_owed)), 0);
  const outstanding = active.reduce((s, r) => s + Math.max(0, Number(r.balance_owed)), 0);

  document.getElementById('statMonth').textContent = money(collectedMonth);
  document.getElementById('statYear').textContent = money(collectedYear);
  document.getElementById('statProjected').textContent = money(projected);
  document.getElementById('statOutstanding').textContent = money(outstanding);

  const CAPACITY = 20;
  const bookedThisMonth = active.filter(r => {
    if (!r.event_date) return false;
    const d = new Date(r.event_date + 'T00:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  document.getElementById('capCount').textContent = `${bookedThisMonth} of ${CAPACITY} dates booked`;
  document.getElementById('capFill').style.width = Math.min(100, (bookedThisMonth / CAPACITY) * 100) + '%';

  const soon = active
    .filter(r => r.event_date && Number(r.balance_owed) > 0)
    .map(r => ({ ...r, daysAway: Math.ceil((new Date(r.event_date + 'T00:00:00') - now) / 86400000) }))
    .filter(r => r.daysAway >= 0 && r.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);

  document.getElementById('attnList').innerHTML = soon.length
    ? soon.map(r => `
      <div class="card attn-item ${r.daysAway <= 7 ? 'urgent' : ''}">
        <div><div class="who">${r.name}</div><div class="when">${fmtDate(r.event_date)} · ${r.daysAway}d away</div></div>
        <div class="owes">${money(r.balance_owed)}<div class="of">owed</div></div>
      </div>`).join('')
    : '<div class="card empty">Nothing needs attention right now.</div>';

  const upcoming = active
    .filter(r => r.event_date && new Date(r.event_date + 'T00:00:00') >= now)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 10);

  document.getElementById('upcomingList').innerHTML = upcoming.length
    ? upcoming.map(r => `
      <div class="upcoming-row">
        <span class="date">${fmtDate(r.event_date)}</span>
        <span>${r.name} — ${eventTypeLabel(r.event_type)}</span>
        ${balancePill(r)}
      </div>`).join('')
    : '<div class="empty">No upcoming events.</div>';
}

/* ---------------- clients + payments ---------------- */
let allClients = [];

async function loadClients() {
  const { data, error } = await db.from('client_balances').select('*').order('event_date', { ascending: true });
  if (error) { toast('Could not load clients.'); return; }
  allClients = data || [];
  renderClients();
}

function renderClients() {
  const search = document.getElementById('clientSearch').value.trim().toLowerCase();
  const statusFilter = document.getElementById('clientStatusFilter').value;
  let rows = allClients;
  if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
  if (search) rows = rows.filter(r => r.name.toLowerCase().includes(search) || (r.phone || '').includes(search));

  const tbody = document.getElementById('clientRows');
  const empty = document.getElementById('clientsEmpty');
  if (!rows.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = rows.map(r => `
    <tr data-id="${r.id}">
      <td>${r.name}</td>
      <td>${eventTypeLabel(r.event_type)}</td>
      <td>${fmtDate(r.event_date)}</td>
      <td class="num">${money(r.contract_price)}</td>
      <td class="num">${money(r.total_paid)}</td>
      <td class="num"><span class="owed ${Number(r.balance_owed) <= 0 ? 'zero' : ''}">${money(r.balance_owed)}</span></td>
      <td>${clientStatusPill(r.status)}</td>
    </tr>`).join('');

  tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => openClientDetail(tr.dataset.id)));
}

document.getElementById('clientSearch').addEventListener('input', renderClients);
document.getElementById('clientStatusFilter').addEventListener('change', renderClients);
document.getElementById('newClientBtn').addEventListener('click', () => openClientForm(null, false));

async function openClientDetail(id) {
  const { data: client, error } = await db.from('clients').select('*').eq('id', id).single();
  if (error || !client) { toast('Could not load client.'); return; }
  openClientForm(client, true);
}

async function openClientForm(client, isEdit) {
  const { data: pkgs } = await db.from('packages').select('id,name,base_price').order('sort_order');

  openModal(`
    <h3>${isEdit ? 'Edit client' : 'New client'}</h3>
    <form id="clientForm">
      <div class="row2">
        <div class="field"><label>Name</label><input name="name" required value="${client?.name || ''}"></div>
        <div class="field"><label>Phone</label><input name="phone" required value="${client?.phone || ''}"></div>
      </div>
      <div class="field"><label>Email</label><input type="email" name="email" value="${client?.email || ''}"></div>
      <div class="row2">
        <div class="field"><label>Event type</label>
          <select name="event_type">
            ${Object.entries(EVENT_TYPES).map(([v, l]) => `<option value="${v}" ${client?.event_type === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Event date</label><input type="date" name="event_date" required value="${client?.event_date || ''}"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Package</label>
          <select name="package_id">
            <option value="">— none —</option>
            ${(pkgs || []).map(p => `<option value="${p.id}" ${client?.package_id === p.id ? 'selected' : ''}>${p.name} (${money(p.base_price)})</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Contract price</label><input type="number" step="0.01" name="contract_price" required value="${client?.contract_price ?? ''}"></div>
      </div>
      <div class="field"><label>Status</label>
        <select name="status">
          ${['active', 'completed', 'cancelled'].map(v => `<option value="${v}" ${client?.status === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Notes</label><textarea name="notes" rows="2">${client?.notes || ''}</textarea></div>
      ${!isEdit ? `
      <div class="row2">
        <div class="field"><label>Deposit taken today (optional)</label><input type="number" step="0.01" name="deposit_amount" placeholder="0.00"></div>
        <div class="field"><label>Deposit method</label>
          <select name="deposit_method"><option>cash</option><option>zelle</option><option>card</option><option>check</option></select>
        </div>
      </div>` : ''}
      <div class="modal-actions">
        ${isEdit ? '<button type="button" class="btn btn-outline btn-sm" id="viewPaymentsBtn">Payments</button>' : ''}
        <button type="button" class="btn btn-outline" id="modalCancel">Cancel</button>
        <button type="submit" class="btn btn-teal">${isEdit ? 'Save changes' : 'Add client'}</button>
      </div>
    </form>
  `);

  const form = document.getElementById('clientForm');

  // pre-fill contract price from the chosen package (new clients only)
  form.package_id.addEventListener('change', () => {
    if (isEdit) return;
    const pkg = (pkgs || []).find(p => p.id === form.package_id.value);
    if (pkg) form.contract_price.value = pkg.base_price;
  });

  if (isEdit) document.getElementById('viewPaymentsBtn').addEventListener('click', () => openPayments(client));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim() || null,
      event_type: form.event_type.value,
      event_date: form.event_date.value,
      package_id: form.package_id.value || null,
      contract_price: parseFloat(form.contract_price.value),
      status: form.status.value,
      notes: form.notes.value.trim() || null
    };

    if (isEdit) {
      const { error } = await db.from('clients').update(payload).eq('id', client.id);
      if (error) { toast('Could not save client.'); return; }
      toast('Client updated.');
    } else {
      const { data: inserted, error } = await db.from('clients').insert(payload).select().single();
      if (error) { toast('Could not add client.'); return; }

      const depositAmount = parseFloat(form.deposit_amount?.value || 0);
      if (depositAmount > 0) {
        await db.from('payments').insert({
          client_id: inserted.id,
          amount: depositAmount,
          type: 'deposit',
          method: form.deposit_method.value,
          note: 'Deposit at booking'
        });
      }

      if (client?._fromInquiry) {
        await db.from('inquiries').update({ converted_client_id: inserted.id, status: 'booked' }).eq('id', client._fromInquiry);
        refreshInqBadge();
      }
      toast('Client added.');
    }
    closeModal();
    loadClients();
    loadDashboard();
  });
}

async function openPayments(client) {
  const { data: pays } = await db.from('payments').select('*').eq('client_id', client.id).order('paid_at', { ascending: false });
  const { data: balRow } = await db.from('client_balances').select('total_paid,balance_owed').eq('id', client.id).single();

  openModal(`
    <h3>${client.name} — payments</h3>
    <div class="detail-stats">
      <div class="card stat"><div class="label">Contract</div><div class="value">${money(client.contract_price)}</div></div>
      <div class="card stat"><div class="label">Paid</div><div class="value">${money(balRow?.total_paid)}</div></div>
      <div class="card stat"><div class="label">Owes</div><div class="value warn">${money(balRow?.balance_owed)}</div></div>
    </div>
    <div id="payRows">
      ${(pays || []).length ? pays.map(p => `
        <div class="pay-row">
          <span>${p.type}${p.method ? ' · ' + p.method : ''}${p.note ? ' · ' + p.note : ''}<div class="meta">${fmtDate(p.paid_at)}</div></span>
          <span class="${Number(p.amount) < 0 ? 'neg' : ''}">${money(p.amount)}</span>
        </div>`).join('') : '<p class="empty">No payments yet.</p>'}
    </div>
    <form id="paymentForm" style="margin-top:1.2rem;border-top:1px solid #eee8db;padding-top:1rem">
      <div class="row2">
        <div class="field"><label>Amount (negative = credit/refund)</label><input type="number" step="0.01" name="amount" required></div>
        <div class="field"><label>Type</label>
          <select name="type">
            <option value="deposit">Deposit</option>
            <option value="payment" selected>Payment</option>
            <option value="credit">Credit</option>
            <option value="refund">Refund</option>
          </select>
        </div>
      </div>
      <div class="row2">
        <div class="field"><label>Method</label><input name="method" placeholder="cash, zelle, card…"></div>
        <div class="field"><label>Date</label><input type="date" name="paid_at" value="${new Date().toISOString().slice(0, 10)}"></div>
      </div>
      <div class="field"><label>Note</label><input name="note"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="modalCancel">Close</button>
        <button type="submit" class="btn btn-teal">Add payment</button>
      </div>
    </form>
  `);

  document.getElementById('paymentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const payload = {
      client_id: client.id,
      amount: parseFloat(f.amount.value),
      type: f.type.value,
      method: f.method.value.trim() || null,
      note: f.note.value.trim() || null,
      paid_at: f.paid_at.value
    };
    const { error } = await db.from('payments').insert(payload);
    if (error) { toast('Could not add payment.'); return; }
    toast('Payment added.');
    closeModal();
    loadClients();
    loadDashboard();
  });
}

/* ---------------- inquiries ---------------- */
async function refreshInqBadge() {
  const { count } = await db.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new');
  const badge = document.getElementById('inqBadge');
  if (count) { badge.style.display = 'inline-block'; badge.textContent = count; }
  else { badge.style.display = 'none'; }
}

async function loadInquiries() {
  const { data, error } = await db.from('inquiries').select('*').order('created_at', { ascending: false });
  if (error) { toast('Could not load inquiries.'); return; }

  const filter = document.getElementById('inqFilter').value;
  let rows = data || [];
  if (filter === 'open') rows = rows.filter(r => r.status === 'new' || r.status === 'contacted');
  else if (filter !== 'all') rows = rows.filter(r => r.status === filter);

  const newCount = (data || []).filter(r => r.status === 'new').length;
  const badge = document.getElementById('inqBadge');
  if (newCount) { badge.style.display = 'inline-block'; badge.textContent = newCount; }
  else { badge.style.display = 'none'; }

  const list = document.getElementById('inqList');
  list.innerHTML = rows.length ? rows.map(r => `
    <div class="card inq-card" data-id="${r.id}">
      <div class="inq-head">
        <div>
          <div class="name">${r.name} ${inqStatusPill(r.status)}</div>
          <div class="inq-meta">${eventTypeLabel(r.event_type)} · ${fmtDate(r.event_date)} · ${r.guest_count || '—'} guests · <a href="tel:${r.phone}">${r.phone}</a></div>
        </div>
      </div>
      ${r.message ? `<div class="inq-msg">${r.message}</div>` : ''}
      <div class="inq-actions">
        <select data-action="status">
          ${['new', 'contacted', 'booked', 'lost'].map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        ${r.converted_client_id ? '<span class="pill paid">Converted</span>' : '<button class="btn btn-outline btn-sm" data-action="convert">Convert to client</button>'}
      </div>
    </div>`).join('') : '<div class="empty">No inquiries here.</div>';

  list.querySelectorAll('.inq-card').forEach(card => {
    const row = rows.find(r => r.id === card.dataset.id);
    card.querySelector('[data-action=status]').addEventListener('change', async e => {
      const { error } = await db.from('inquiries').update({ status: e.target.value }).eq('id', row.id);
      if (error) { toast('Could not update status.'); return; }
      loadInquiries();
    });
    const convertBtn = card.querySelector('[data-action=convert]');
    if (convertBtn) convertBtn.addEventListener('click', () => openClientForm({
      name: row.name, phone: row.phone, email: row.email,
      event_type: row.event_type, event_date: row.event_date,
      notes: row.message ? `From inquiry: ${row.message}` : null,
      _fromInquiry: row.id
    }, false));
  });
}

document.getElementById('inqFilter').addEventListener('change', loadInquiries);

/* ---------------- settings: packages ---------------- */
async function loadPackagesAdmin() {
  const { data, error } = await db.from('packages').select('*').order('sort_order');
  if (error) { toast('Could not load packages.'); return; }

  const list = document.getElementById('pkgList');
  list.innerHTML = (data || []).length ? data.map(p => `
    <div class="card settings-item" data-id="${p.id}">
      <div>
        <strong>${p.name}</strong> ${p.is_popular ? '<span class="pill paid">Popular</span>' : ''} ${!p.active ? '<span class="pill muted">Hidden</span>' : ''}
        <div style="font-size:.8rem;color:var(--grey)">${money(p.base_price)} · ${(p.included_items || []).length} items</div>
      </div>
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-outline btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div>
    </div>`).join('') : '<div class="empty">No packages yet.</div>';

  list.querySelectorAll('.settings-item').forEach(item => {
    const pkg = data.find(p => p.id === item.dataset.id);
    item.querySelector('[data-action=edit]').addEventListener('click', () => openPackageForm(pkg));
    item.querySelector('[data-action=delete]').addEventListener('click', () => deletePackage(pkg));
  });
}

document.getElementById('newPkgBtn').addEventListener('click', () => openPackageForm(null));

function openPackageForm(pkg) {
  const isEdit = !!pkg;
  openModal(`
    <h3>${isEdit ? 'Edit package' : 'New package'}</h3>
    <form id="pkgForm">
      <div class="field"><label>Name</label><input name="name" required value="${pkg?.name || ''}"></div>
      <div class="row2">
        <div class="field"><label>Base price</label><input type="number" step="0.01" name="base_price" required value="${pkg?.base_price ?? ''}"></div>
        <div class="field"><label>Sort order</label><input type="number" name="sort_order" value="${pkg?.sort_order ?? 0}"></div>
      </div>
      <div class="field"><label>Description</label><textarea name="description" rows="2">${pkg?.description || ''}</textarea></div>
      <div class="field"><label>Included items (one per line)</label><textarea name="included_items" rows="4">${(pkg?.included_items || []).join('\n')}</textarea></div>
      <div class="row2">
        <div class="field"><label style="display:flex;align-items:center;gap:.4rem"><input type="checkbox" name="is_popular" ${pkg?.is_popular ? 'checked' : ''} style="width:auto">Mark as popular</label></div>
        <div class="field"><label style="display:flex;align-items:center;gap:.4rem"><input type="checkbox" name="active" ${pkg?.active !== false ? 'checked' : ''} style="width:auto">Visible on site</label></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="modalCancel">Cancel</button>
        <button type="submit" class="btn btn-teal">${isEdit ? 'Save changes' : 'Add package'}</button>
      </div>
    </form>
  `);

  document.getElementById('pkgForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const payload = {
      name: f.name.value.trim(),
      base_price: parseFloat(f.base_price.value),
      sort_order: parseInt(f.sort_order.value, 10) || 0,
      description: f.description.value.trim() || null,
      included_items: f.included_items.value.split('\n').map(s => s.trim()).filter(Boolean),
      is_popular: f.is_popular.checked,
      active: f.active.checked
    };
    const { error } = isEdit
      ? await db.from('packages').update(payload).eq('id', pkg.id)
      : await db.from('packages').insert(payload);
    if (error) { toast('Could not save package.'); return; }
    toast(isEdit ? 'Package updated.' : 'Package added.');
    closeModal();
    loadPackagesAdmin();
  });
}

async function deletePackage(pkg) {
  if (!confirm(`Delete "${pkg.name}"? This can't be undone.`)) return;
  const { error } = await db.from('packages').delete().eq('id', pkg.id);
  if (error) { toast("Could not delete — it's probably linked to a client."); return; }
  toast('Package deleted.');
  loadPackagesAdmin();
}

/* ---------------- settings: gallery ---------------- */
async function loadGalleryAdmin() {
  const { data, error } = await db.from('gallery').select('*').order('sort_order');
  if (error) { toast('Could not load gallery.'); return; }

  const grid = document.getElementById('galleryAdminGrid');
  grid.innerHTML = (data || []).map(g => `
    <div class="g-thumb" data-id="${g.id}">
      <img src="${g.image_url}" alt="${g.alt_text || ''}" loading="lazy">
      <span class="cat">${g.category}</span>
      <button class="del" data-action="delete">Delete</button>
    </div>`).join('');

  grid.querySelectorAll('.g-thumb').forEach(thumb => {
    const item = data.find(g => g.id === thumb.dataset.id);
    thumb.querySelector('.del').addEventListener('click', () => deleteGalleryItem(item));
  });
}

document.getElementById('galleryUploadBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('galleryFile');
  const file = fileInput.files[0];
  if (!file) { toast('Choose a photo first.'); return; }
  const cats = [...document.querySelectorAll('#galleryCats input:checked')].map(c => c.value);
  if (!cats.length) { toast('Check at least one category.'); return; }

  // storage keys choke on spaces/accents — strip them from the filename
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const path = `${Date.now()}-${safeName}`;
  const { error: upErr } = await db.storage.from('gallery-images').upload(path, file);
  if (upErr) { toast('Upload failed — ' + upErr.message); return; }

  const { data: pub } = db.storage.from('gallery-images').getPublicUrl(path);
  // one photo can live in several categories — one gallery row per checked box,
  // all pointing at the same uploaded file
  const rows = cats.map(category => ({
    image_url: pub.publicUrl, category, alt_text: `Venecia Reception Hall — ${category}`
  }));
  const { error: insErr } = await db.from('gallery').insert(rows);
  if (insErr) { toast('Uploaded, but could not save it to the gallery list.'); return; }

  toast(cats.length > 1 ? `Photo added to ${cats.length} categories.` : 'Photo uploaded.');
  fileInput.value = '';
  document.querySelectorAll('#galleryCats input:checked').forEach(c => c.checked = false);
  loadGalleryAdmin();
});

async function deleteGalleryItem(item) {
  if (!confirm(`Remove this photo from "${item.category}"? (If it's in other categories too, those copies stay.)`)) return;
  const { error } = await db.from('gallery').delete().eq('id', item.id);
  if (error) { toast('Could not delete photo.'); return; }
  toast('Photo deleted.');
  loadGalleryAdmin();
}
