import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function displayGitHubStats() {
    try {
      const profileStats = document.querySelector('#profile-stats');
      if (!profileStats) return;
  
      const githubData = await fetchGitHubData('your-github-username'); // <-- replace with your username
      if (!githubData) return;
  
      profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    } catch (error) {
      console.error('Error fetching GitHub stats:', error);
    }
  }

displayGitHubStats();


async function displayLatestProjects() {
  try {
    // Fetch all projects
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector('.projects');


    renderProjects(latestProjects, projectsContainer, 'h2');

  } catch (error) {
    console.error('Error displaying latest projects:', error);
  }
}


displayLatestProjects();
