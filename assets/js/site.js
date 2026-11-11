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

for (const [index, item] of [...document.querySelectorAll('.video-item')].entries()) {
  item.querySelector('p').dataset.number = String(index + 1).padStart(2, '0');
  const button = item.querySelector('.video-play');
  button.addEventListener('click', () => {
    const id = button.dataset.videoId;
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = `Showcase video ${index + 1}`;
    frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    button.replaceWith(frame);
  }, {once:true});
}

const navLinks = [...nav.querySelectorAll('a')];
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  }
}, {rootMargin:'-25% 0px -60% 0px'});
document.querySelectorAll('.content-section').forEach((section) => observer.observe(section));
