console.log("IT'S ALIVE!");

function $$(selector, context = document){
    return Array.from(context.querySelectorAll(selector));
}

// Helper function: returns an array of elements matching a selector
var $$ = (selector) => Array.from(document.querySelectorAll(selector));
let navLinks = $$("nav a");
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
if (currentLink) {
  currentLink.classList.add("current");
}


let pages = [
  { url: '', title: 'Home' },
  { url: 'projects.html', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/paige-saeng', title: 'GitHub' } 
];

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/'                     
    : '/LAB1-TEST/';          


let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
  let url = p.url;
  let title = p.title;


  url = !url.startsWith('http') ? BASE_PATH + url : url;


  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;


  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  a.toggleAttribute('target', a.host !== location.host);
  nav.append(a);
}

// Dark-mode / Theme Switcher

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const themeSelect = document.querySelector('.color-scheme select');
const root = document.documentElement;

themeSelect.addEventListener('change', () => {
  root.style.colorScheme = themeSelect.value;
  localStorage.setItem('theme', themeSelect.value); // remember preference
});

const saved = localStorage.getItem('theme');
if (saved) {
  root.style.colorScheme = saved;
  themeSelect.value = saved;
}
