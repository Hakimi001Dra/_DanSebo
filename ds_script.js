import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
//  PASTE YOUR DANSEBO SUPABASE CREDENTIALS HERE
// ============================================================
const SUPABASE_URL      = 'https://ddgwhpwkwpscpjeckxzh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZ3docHdrd3BzY3BqZWNreHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTc5ODgsImV4cCI6MjA5NTA5Mzk4OH0.Mae_KDZNBmZ2Yg8hsA5ILojbab_v01n0APRPDgWERRE'
// ============================================================

let supabase = null
try {
  if (!SUPABASE_URL.includes('YOUR_PROJECT_REF') && !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } else {
    console.warn('DanSebo: Add your Supabase credentials to script.js')
  }
} catch(e) { console.error('Supabase init failed:', e) }

// ── LOAD REVIEWS ──
async function loadReviews() {
  const list = document.getElementById('reviewsList')
  if (!list) return
  if (!supabase) {
    list.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.3);">Connect Supabase to load reviews.</div>`
    return
  }
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(12)
  if (error || !data?.length) {
    list.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.3);"><i class="fas fa-comment-slash" style="font-size:2rem;margin-bottom:12px;display:block;"></i>No reviews yet. Be the first!</div>`
    return
  }
  list.innerHTML = data.map(r => `
    <div class="review-card">
      <div class="review-stars">★★★★★</div>
      <p class="review-text">"${esc(r.text)}"</p>
      <div class="review-author">
        <div class="review-avatar">${(r.name||'?')[0].toUpperCase()}</div>
        <div>
          <div class="review-name">${esc(r.name)}</div>
          <div class="review-date">${r.org ? esc(r.org) + ' · ' : ''}${r.date || ''}</div>
        </div>
      </div>
    </div>
  `).join('')
}

// ── SUBMIT REVIEW ──
async function submitReview() {
  const name = (document.getElementById('reviewName')?.value || '').trim()
  const org  = (document.getElementById('reviewOrg')?.value  || '').trim()
  const text = (document.getElementById('reviewText')?.value || '').trim()
  const msg  = document.getElementById('reviewMsg')

  if (!name || !text) { showMsg(msg, 'Please enter your name and review.', 'error'); return }
  if (!supabase) { showMsg(msg, 'Supabase not connected.', 'error'); return }

  const { error } = await supabase.from('reviews').insert([{
    name, org, text,
    date: new Date().toLocaleDateString(),
    created_at: new Date().toISOString()
  }])
  if (error) { showMsg(msg, 'Error: ' + error.message, 'error'); return }
  showMsg(msg, '✅ Thank you for your review!', 'success')
  document.getElementById('reviewName').value = ''
  document.getElementById('reviewOrg').value  = ''
  document.getElementById('reviewText').value = ''
  await Promise.all([loadReviews(), loadGallery()])
}

// ── LOAD GALLERY ──
async function loadGallery() {
  const grid = document.getElementById('galleryGrid')
  if (!grid) return
  if (!supabase) {
    grid.innerHTML = `<div class="gallery-item empty-card">Connect Supabase to load gallery.</div>`
    return
  }

  const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(12)
  if (error || !data?.length) {
    grid.innerHTML = `<div class="gallery-item empty-card"><i class="fas fa-images"></i>No gallery items yet.</div>`
    return
  }

  grid.innerHTML = data.map(item => `
    <div class="gallery-item">
      <img src="${esc(item.image_url)}" alt="${esc(item.title)}">
      <div class="gallery-label">${esc(item.title)}</div>
    </div>
  `).join('')
}

// ── LOAD TEAM ──
async function loadTeam() {
  const grid = document.getElementById('teamGrid')
  if (!grid) return
  if (!supabase) {
    grid.innerHTML = `<div class="team-card empty-card">Connect Supabase to load team members.</div>`
    return
  }

  const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: false }).limit(12)
  if (error || !data?.length) {
    grid.innerHTML = `<div class="team-card empty-card"><i class="fas fa-users"></i>No team members added yet.</div>`
    return
  }

  grid.innerHTML = data.map(member => {
    const initials = member.name ? member.name.split(' ').map(part => part[0].toUpperCase()).slice(0,2).join('') : '?'
    const avatarStyle = member.image_url ? `style="background-image:url('${esc(member.image_url)}')"` : ''
    return `
      <div class="team-card fade-in">
        <div class="team-avatar" ${avatarStyle}>${member.image_url ? '' : initials}</div>
        <h3>${esc(member.name)}</h3>
        <div class="role">${esc(member.role)}</div>
        <div class="dept">${esc(member.dept)}</div>
      </div>
    `
  }).join('')
}

// ── LOAD SITE SETTINGS ──
async function loadSiteSettings() {
  const logoImg = document.getElementById('siteLogo')
  const logoFallback = document.getElementById('logoFallback')
  if (!logoImg || !logoFallback || !supabase) return

  const { data, error } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
  if (error || !data?.value) {
    logoImg.hidden = true
    logoFallback.style.display = 'flex'
    return
  }

  logoImg.src = data.value
  logoImg.hidden = false
  logoFallback.style.display = 'none'
  logoImg.addEventListener('error', () => {
    logoImg.hidden = true
    logoFallback.style.display = 'flex'
  })
}

// ── SEND CONTACT MESSAGE ──
async function sendMessage() {
  const name    = (document.getElementById('contactName')?.value    || '').trim()
  const email   = (document.getElementById('contactEmail')?.value   || '').trim()
  const service = (document.getElementById('contactService')?.value || '').trim()
  const message = (document.getElementById('contactMessage')?.value || '').trim()
  const msg     = document.getElementById('contactMsg')

  if (!name || !email || !message) { showMsg(msg, 'Please fill in all required fields.', 'error'); return }
  if (!supabase) {
    // Fallback: open WhatsApp
    const wa = `Hello DanSebo! My name is ${name}. Service needed: ${service || 'General Inquiry'}. Message: ${message}. Contact: ${email}`
    window.open(`https://wa.me/2347068383802?text=${encodeURIComponent(wa)}`, '_blank')
    return
  }
  const { error } = await supabase.from('messages').insert([{
    name, email, service, message,
    created_at: new Date().toISOString()
  }])
  if (error) { showMsg(msg, 'Error: ' + error.message, 'error'); return }
  showMsg(msg, '✅ Message sent! We will get back to you shortly.', 'success')
  document.getElementById('contactName').value    = ''
  document.getElementById('contactEmail').value   = ''
  document.getElementById('contactService').value = ''
  document.getElementById('contactMessage').value = ''
}

// ── HELPERS ──
function showMsg(el, text, type) {
  if (!el) return
  el.className = 'form-msg ' + type
  el.innerText = text
  setTimeout(() => { el.className = 'form-msg'; el.innerText = '' }, 5000)
}

function esc(str) {
  if (!str) return ''
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m])
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadReviews(), loadGallery(), loadTeam(), loadSiteSettings()])

  document.getElementById('submitReviewBtn')?.addEventListener('click', submitReview)
  document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage)
})
