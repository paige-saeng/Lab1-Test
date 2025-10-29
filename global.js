console.log("IT'S ALIVE!");

function $$(selector, context = document){
    return Array.from(context.querySelectorAll(selector));
}

let navLinks = $$("nav a");
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
if (currentLink) {
  currentLink.classList.add("current");
}


let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/paige-saeng', title: 'GitHub' } 
];

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/'                     
    : '/Lab1-Test/';  



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

// lab 4 
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    // Check if the response was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    // inspect the response object
    console.log(response);

    // Parse the response body as JSON
    const data = await response.json();

    // Return the parsed data
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}


//step1.5 and lab 5
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Step 1: Validate inputs
  if (!Array.isArray(projects)) {
    console.error('renderProjects: projects is not an array', projects);
    return;
  }

  if (!(containerElement instanceof HTMLElement)) {
    console.error('renderProjects: containerElement is invalid', containerElement);
    return;
  }

  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadings.includes(headingLevel)) headingLevel = 'h2';


  //  Handle empty projects array
  if (projects.length === 0) {
    containerElement.innerHTML = '<p>No projects available at the moment.</p>';
    return;
  }

  //  Loop through each projects
  projects.forEach(project => {
    const article = document.createElement('article');
// Build inner content step by step to avoid HTML parsing issues
const title = document.createElement(headingLevel);
title.textContent = project.title || 'Untitled Project';

if (project.image) {
  const img = document.createElement('img');
  img.src = project.image;
  img.alt = project.title || 'Project image';
  article.appendChild(img);
}

const infoDiv = document.createElement('div');
infoDiv.classList.add('project-info');

const description = document.createElement('p');
description.textContent = project.description || 'No description available.';
infoDiv.appendChild(description);

// ✅ Add year safely
if (project.year) {
  const year = document.createElement('p');
  year.classList.add('project-year');
  year.textContent = `Year: ${project.year}`;
  infoDiv.appendChild(year);
}

// Append all elements
article.appendChild(title);
article.appendChild(infoDiv);
containerElement.appendChild(article);
});
}
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}



