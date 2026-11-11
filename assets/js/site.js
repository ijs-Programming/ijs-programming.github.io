const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

const videoGrid = document.querySelector('.video-grid');
const categoryFilters = document.querySelector('.category-filters');
const preferredCategories = ['Combat', 'Incremental Games', 'Horror'];
let activeCategory = 'All';
let allVideos = [...videoGrid.querySelectorAll('.video-item')].map((card, index) => {
  const button = card.querySelector('.video-play');
  return {
    id: card.dataset.id,
    type: button.dataset.videoId ? 'youtube' : 'local',
    youtubeId: button.dataset.videoId,
    src: button.dataset.videoSrc,
    category: card.dataset.category,
    title: card.querySelector('.video-title').textContent,
    description: card.querySelector('p').textContent,
    addedAt: card.dataset.addedAt,
    order: index
  };
});

function playVideo(button) {
  const wrapper = button.closest('.video-wrapper');
  let player;
  if (button.dataset.videoId) {
    player = document.createElement('iframe');
    player.src = `https://www.youtube-nocookie.com/embed/${button.dataset.videoId}?autoplay=1&rel=0`;
    player.title = button.getAttribute('aria-label');
    player.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
  } else {
    player = document.createElement('video');
    player.src = button.dataset.videoSrc;
    player.controls = true;
    player.autoplay = true;
    player.playsInline = true;
    player.preload = 'metadata';
    player.setAttribute('aria-label', button.getAttribute('aria-label'));
  }
  wrapper.replaceChildren(player);
  if (player.tagName === 'VIDEO') player.play().catch(() => {});
}

videoGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.video-play');
  if (button && videoGrid.contains(button)) playVideo(button);
});

function makeCard(entry) {
  const card = document.createElement('div');
  card.className = 'video-item';
  card.dataset.id = entry.id;
  card.dataset.category = entry.category || 'Other';
  if (entry.id === allVideos[0].id) {
    card.classList.add('is-newest');
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = 'NEW!';
    card.append(badge);
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-play';
  button.setAttribute('aria-label', `Play ${entry.title || 'showcase video'}`);
  if (entry.type === 'youtube') {
    button.dataset.videoId = entry.youtubeId;
    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${encodeURIComponent(entry.youtubeId)}/hqdefault.jpg`;
    image.alt = '';
    image.loading = 'lazy';
    button.append(image);
  } else {
    button.dataset.videoSrc = entry.src;
    button.classList.add('local-video');
    if (entry.poster) {
      const image = document.createElement('img');
      image.src = entry.poster;
      image.alt = '';
      image.loading = 'lazy';
      button.append(image);
    }
    const name = document.createElement('span');
    name.className = 'local-name';
    name.textContent = entry.title || 'Showcase video';
    button.append(name);
  }
  const icon = document.createElement('span');
  icon.className = 'play-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '▶';
  button.append(icon);
  wrapper.append(button);
  const category = document.createElement('span');
  category.className = 'video-category';
  category.textContent = entry.category || 'Other';
  const heading = document.createElement('h3');
  heading.className = 'video-title';
  heading.textContent = entry.title || 'Showcase Video';
  const description = document.createElement('p');
  description.textContent = entry.description;
  card.append(wrapper, category, heading, description);
  return card;
}

function renderVideos() {
  const visible = activeCategory === 'All' ? allVideos : allVideos.filter((entry) => (entry.category || 'Other') === activeCategory);
  videoGrid.replaceChildren(...visible.map(makeCard));
}

function renderFilters() {
  const counts = new Map();
  for (const entry of allVideos) {
    const category = entry.category || 'Other';
    counts.set(category, (counts.get(category) || 0) + 1);
  }
  if (activeCategory !== 'All' && !counts.has(activeCategory)) activeCategory = 'All';
  const categories = [...counts.keys()].sort((a, b) => {
    const aIndex = preferredCategories.indexOf(a);
    const bIndex = preferredCategories.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    return a.localeCompare(b);
  });
  categoryFilters.replaceChildren();
  for (const category of ['All', ...categories]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-filter';
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(activeCategory === category));
    button.textContent = category;
    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = String(category === 'All' ? allVideos.length : counts.get(category));
    button.append(count);
    categoryFilters.append(button);
  }
}

categoryFilters.addEventListener('click', (event) => {
  const button = event.target.closest('.category-filter');
  if (!button || !categoryFilters.contains(button)) return;
  activeCategory = button.dataset.category;
  renderFilters();
  renderVideos();
});

renderFilters();
renderVideos();
fetch('videos.json', {cache: 'no-cache'})
  .then((response) => {
    if (!response.ok) throw new Error('Video catalog unavailable');
    return response.json();
  })
  .then((entries) => {
    if (!Array.isArray(entries) || !entries.length) throw new Error('Video catalog empty');
    allVideos = entries.sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt) || (a.order ?? 0) - (b.order ?? 0));
    renderFilters();
    renderVideos();
  })
  .catch((error) => console.warn('Using the built-in video gallery:', error));

const navLinks = [...nav.querySelectorAll('a')];
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  }
}, {rootMargin: '-25% 0px -60% 0px'});
document.querySelectorAll('.content-section').forEach((section) => observer.observe(section));

const scrollProgress = document.querySelector('.scroll-progress');
let progressQueued = false;
function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
  scrollProgress.style.transform = `scaleX(${progress})`;
  progressQueued = false;
}
window.addEventListener('scroll', () => {
  if (!progressQueued) {
    progressQueued = true;
    requestAnimationFrame(updateScrollProgress);
  }
}, {passive: true});
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();
