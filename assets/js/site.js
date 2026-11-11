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

function markNewest() {
  const cards = [...videoGrid.querySelectorAll('.video-item')];
  cards.forEach((card, index) => {
    card.classList.toggle('is-newest', index === 0);
    card.querySelector('.new-badge')?.remove();
    if (index === 0) {
      const badge = document.createElement('span');
      badge.className = 'new-badge';
      badge.textContent = 'NEW!';
      card.prepend(badge);
    }
  });
}

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
  const heading = document.createElement('h3');
  heading.className = 'video-title';
  heading.textContent = entry.title;
  const description = document.createElement('p');
  description.textContent = entry.description;
  card.append(wrapper, heading, description);
  return card;
}

markNewest();
fetch('videos.json', {cache: 'no-cache'})
  .then((response) => {
    if (!response.ok) throw new Error('Video catalog unavailable');
    return response.json();
  })
  .then((entries) => {
    if (!Array.isArray(entries) || !entries.length) throw new Error('Video catalog empty');
    entries.sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt) || (a.order ?? 0) - (b.order ?? 0));
    videoGrid.replaceChildren(...entries.map(makeCard));
    markNewest();
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
