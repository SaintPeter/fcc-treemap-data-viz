const cashFormatter = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const decimalFormatter = Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const datasets = {
  videogames: {
    title: "Video Game Sales",
    description: "Top 100 Most Sold Video Games Grouped by Platform",
    url:"https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json",
    formatter: decimalFormatter
  },
  movies: {
    title: "Movie Sales",
    description: "Top 100 Highest Grossing Movies Grouped By Genre",
    url:"https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json",
    formatter: cashFormatter
  },
  kickstarter: {
    title: "Kickstarter Pledges",
    description: "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
    url:"https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json",
    formatter: cashFormatter
  }
}


// Routing change handler
window.addEventListener('popstate', () => {
  handleLoadData();
})

// Data Loader
function handleLoadData() {
  let url;
  let lookup = window.location.hash.slice(1);
  if(datasets.hasOwnProperty(lookup)) {
    url = datasets[lookup].url;
  } else {
    url = datasets["kickstarter"].url;
    window.history.pushState(null, null, '#kickstarter')
    lookup = "kickstarter"
  }
  //url = url.replace(new RegExp('.*/'),'')
  d3.json(url)
    .then(data => processData(data,
      datasets[lookup].title,
      datasets[lookup].description,
      datasets[lookup].formatter,
      lookup))
    .catch(err => console.warn("Error", err))
}

handleLoadData();



function processData(data, title, description, formatter, lookup) {
  // Extract Category Names
  let categories = data.children.map(d => d.name);

  // Extract cluster data
  let root = d3.hierarchy(data).sum(d => d.value);

  let margin = {
    left: 50,
    right: 200,
    top: 100,
    bottom: 50
  }

  // Measure active area width and height
  let w = parseInt(d3.select('svg').style('width')) - margin.left - margin.right;
  let h = parseInt(d3.select('svg').style('height')) - margin.top - margin.bottom;

  let tooltip = d3.select(".tooltip")

  // Treemap Setup
  d3.treemap()
    .size([w, h])
    (root)

  // Color Scale
  let colorList = d3.schemePaired.concat(d3.schemeSet3);
  let colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(colorList)

  // Init SVG
  let svg = d3.select('body')
    .select('svg')
    .attr("width", w + margin.left + margin.right)
    .attr("height",  h + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${w + margin.left + margin.right} ${h + margin.top + margin.bottom}`);

  // Clear All SVG Data
  svg.selectAll("*").remove();

  // Primary Data Display
  let innerSvg = svg.append('svg')
    .attr("x", margin.left)
    .attr("y", margin.top)

  let groups = innerSvg.selectAll('g')
    .data(root.leaves())
    .enter()
    .append('g')

    groups.append('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('class', 'tile' )
    .attr('fill', d => colorScale(d.data.category))
    .attr('data-name', d => d.data.name)
    .attr('data-category', d => d.data.category)
    .attr('data-value', d => d.data.value)
    .style('overflow', 'hidden')
      .on('mousemove', handle_mouseover)
      .on('mouseout', handle_mouseout)

    // Wrapping text area
    groups.append("foreignObject")
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      //.attr('height', d => d.y1 - d.y0)
      .attr('class', 'fo_text')
    .append("xhtml:div")
      .attr('class', 'tile_text')
      .text(d => d.data.name)


  function handle_mouseover(e, d) {
    let value = d.data.value;
    let ttText = `Name: ${d.data.name}<br>` +
      `Category: ${d.data.category}<br>` +
      `Value: ${formatter.format(d.data.value)}`

    tooltip
      .style('display','inline-block')
      .style('opacity', 0.9)
      .html(ttText)
      .style("left", e.clientX  + 10 + "px")
      .style("top", e.clientY  - 70 + "px")
      .attr('data-value', value)
  }

  function handle_mouseout() {
    tooltip
      .style("opacity", 0)
      .style("display", "none");
  }

  // Chart Title
  svg.append('text')
    .text(title)
    .attr('id', 'title')
    .attr('class','title')
    .attr('x', w/2 + margin.left)
    .attr('y', margin.top / 2)

  // Chart Subtitle / Description
  svg.append('text')
    .html(description)
    .attr('class', 'subtitle')
    .attr('x', w/ 2 + margin.left)
    .attr('y', margin.top - 20)
    .attr('id', 'description')

  // Legend
  let legend = d3.legendColor()
    .shapeWidth(20)
    .shapeHeight(20)
    .orient('vertical')
    .scale(colorScale)

  let legGroup = svg.append('g')
    .attr('class', 'legend')
    .attr('id', 'legend')
    .call(legend)

  let legendX =  margin.left + w + (margin.right - legGroup.node().getBBox().width) / 2
  let legendY = ((h - legGroup.node().getBBox().height) / 2) + margin.top
  legGroup.attr('transform', `translate(${ legendX },${ legendY })`)

  svg.selectAll('rect.swatch')
    .attr('class', 'swatch legend-item')

  d3.selectAll('a')
    .each((d, i, nodes) => {
      if(nodes[i].getAttribute('href').slice(1) === lookup) {
        nodes[i].setAttribute('class', 'active')
      } else {
        nodes[i].removeAttribute('class')
      }
    })

}

