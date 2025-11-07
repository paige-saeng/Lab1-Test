import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

console.log("✅ main.js is running");

// Load CSV and process data

async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;
    const ret = {
      id: commit,
      url: 'https://github.com/YOUR_REPO/commit/' + commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines // store all lines for language breakdown
    };
    return ret;
  });
}

// Render Stats Dashboard

function renderCommitInfo(data, commits) {
  const container = d3.select('.stats-container')
    .style('display', 'flex')
    .style('flex-wrap', 'wrap')
    .style('gap', '16px')
    .style('margin-bottom', '40px');

  function addStat(label, value) {
    const card = container.append('dl')
      .attr('class', 'stat-card')
      .style('flex', '1 1 200px')
      .style('padding', '12px')
      .style('background', '#f5f5f5')
      .style('border-radius', '6px')
      .style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)');

    card.append('dt')
      .text(label)
      .style('font-weight', 'bold')
      .style('margin-bottom', '4px');

    card.append('dd')
      .text(value)
      .style('font-size', '1.2em')
      .style('margin', '0');
  }

  addStat('Total Lines of Code (LOC)', data.length);
  addStat('Total Commits', commits.length);
  addStat('Number of Files', d3.group(data, d => d.file).size);
  addStat('Number of Authors', d3.group(data, d => d.author).size);
  addStat('Max Depth', d3.max(data, d => d.depth));
  addStat('Average Depth', d3.mean(data, d => d.depth).toFixed(2));
  addStat('Average Line Length', d3.mean(data, d => d.length).toFixed(2));

  const longestLine = d3.greatest(data, d => d.length);
  addStat('Longest Line Length', longestLine.length);
}


// Tooltip helpers

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function moveTooltip(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const offset = 15; // distance from cursor
  tooltip.style.left = (event.pageX + offset) + 'px';
  tooltip.style.top = (event.pageY + offset) + 'px';
}

function renderTooltipContent(commit) {
  if (!commit) return;
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString();
  document.getElementById('commit-time').textContent = commit.datetime.toLocaleTimeString();
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}


// Selection / Language Breakdown helpers

function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d, xScale, yScale))
    : [];
  const countEl = document.getElementById('selection-count');
  countEl.textContent = `${selectedCommits.length || 'No'} commits selected`;
  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d, xScale, yScale))
    : [];
  const container = document.getElementById('language-breakdown');
  if (!selectedCommits.length) {
    container.innerHTML = '';
    return;
  }
  const lines = selectedCommits.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${d3.format('.1~%')(proportion)})</dd>`;
  }
}

// ----------------------
// Render Scatterplot with brushing
// ----------------------
function renderScatterPlot(commits) {
  const width = 700;
  const height = 400;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const usableWidth = width - margin.left - margin.right;
  const usableHeight = height - margin.top - margin.bottom;

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([margin.left, width - margin.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableWidth))
    .selectAll('line')
    .attr('stroke', '#ccc')
    .attr('stroke-dasharray', '2,2');

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat("%b %d")));

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => String(d).padStart(2,'0') + ':00'));

  // Dot radius scale
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2,30]);

  // Sort commits so smaller dots are on top
  const sortedCommits = commits.slice().sort((a,b) => b.totalLines - a.totalLines);

  // Dots
  const dots = svg.append('g').attr('class', 'dots');
  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).attr('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      moveTooltip(event);
    })
    .on('mousemove', event => moveTooltip(event))
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).attr('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // ----------------------
  // Brush
  // ----------------------
  const brush = d3.brush()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on('start brush end', brushed);

  svg.append('g')
    .attr('class', 'brush')
    .call(brush);
    svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', margin.left + usableWidth / 2) // center along X
    .attr('y', height - 10) // slightly below axis
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('fill', '#333')
    .text('Date'); // change this to whatever label you want
  svg.append('text')
  .attr('class', 'axis-label')
  .attr('x', - (margin.top + usableHeight / 2)) // rotated, so x becomes vertical
  .attr('y', 15) // offset from left margin
  .attr('transform', 'rotate(-90)')
  .attr('text-anchor', 'middle')
  .attr('font-size', '14px')
  .attr('fill', '#333')
  .text('Hour of Day'); // change as needed


  svg.selectAll('.dots').raise();

  function brushed(event) {
    const selection = event.selection;
    dots.selectAll('circle')
      .classed('selected', d => isCommitSelected(selection, d, xScale, yScale));

    renderSelectionCount(selection, commits, xScale, yScale);
    renderLanguageBreakdown(selection, commits, xScale, yScale);
  }
}

// ----------------------
// Main
// ----------------------
async function main() {
  const data = await loadData();
  const commits = processCommits(data);

  renderCommitInfo(data, commits);
  renderScatterPlot(commits);
}

main();
