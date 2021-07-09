const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

window.onload = window.onpopstate = init;

async function init() {
  const today = new Date();
  let year = today.getFullYear();

  // Try to get the year from the URL
  if (window.location.hash) {
    const yearFromURL = parseInt(window.location.hash.substring(1), 10);

    if (yearFromURL) {
      year = yearFromURL;
    }
  }

  // Scroll to the top of the page
  window.scrollTo(0, 0);

  // Get and render the data from the sheet
  document.body.classList.add("is-loading");

  render(transform(await get(year)));

  document.body.classList.remove("is-loading");
}

async function get(year) {
  console.time("get");

  const response = await fetch("https://quadrinhos.herokuapp.com/" + year);
  const json = await response.json();

  console.timeEnd("get");

  return json;
}

function transform(rows) {
  console.time("transform");

  const tmp = rows.map((row, index) => {
    const {
      date, publisher, title, pages, issues, format, link = "#"
     } = row;

    return {
      number: index + 1,
      date: date ? new Date(date) : null,
      publisher,
      title,
      pages: pages,
      issues: issues,
      format,
      link,
    };
  });

  console.timeEnd("transform");

  return tmp;
}

function render(rows) {
  console.time("render");

  const read = rows.filter(row => row.date);

  renderStats(read);
  renderEmptyChart();
  renderRows(rows);

  console.timeEnd("render");
}

function renderStats(rows) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const add = (x, y) => x + y;

  console.time("render stats");

  const statsTotal = document.getElementById("stats-total");

  statsTotal.textContent = rows.length;
  statsTotal.addEventListener("click", () => renderChart(rows, () => 1));

  const statsPaper = document.getElementById("stats-paper");

  statsPaper.textContent = rows
    .filter(row => row.format !== "Digital")
    .length;

  statsPaper.addEventListener("click", () => renderChart(rows, row => row.format !== "Digital" ? 1 : 0));

  const statsDigital = document.getElementById("stats-digital");

  statsDigital.textContent = rows
    .filter(row => row.format === "Digital")
    .length;

  statsDigital.addEventListener("click", () => renderChart(rows, row => row.format === "Digital" ? 1 : 0));

  const statsPages = document.getElementById("stats-pages");

  const totalOfPages = rows
    .map(row => row.pages)
    .reduce(add, 0);

  statsPages.textContent = totalOfPages;

  statsPages.addEventListener("click", () => renderChart(rows, row => row.pages));

  const statsIssues = document.getElementById("stats-issues");

  const totalOfIssues = rows
    .map(row => row.issues)
    .reduce(add, 0);

  statsIssues.textContent = totalOfIssues;

  statsIssues.addEventListener("click", () => renderChart(rows, row => row.issues));

  const statsPagesPerMonth = document.getElementById("stats-pages-per-month");

  statsPagesPerMonth.textContent = Math.round(totalOfPages / month);

  const statsIssuesPerMonth = document.getElementById("stats-issues-per-month");

  statsIssuesPerMonth.textContent = Math.round(totalOfIssues / month);

  console.timeEnd("render stats");
}

function renderRows(rows) {
  console.time("render rows");

  const fragment = document.createDocumentFragment();

  for (const { number, date, publisher, title, pages, issues, format, link } of rows) {
    const cardHeaderNumber = document.createElement("div");

    cardHeaderNumber.className = "number";
    cardHeaderNumber.textContent = `#${number}`;

    const cardHeaderDate = document.createElement("div");

    cardHeaderDate.className = "date";

    cardHeaderDate.textContent = date
      ? date.toLocaleDateString("pt-BR", { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" })
      : "...";

    const cardHeader = document.createElement("div");

    cardHeader.appendChild(cardHeaderNumber);
    cardHeader.appendChild(cardHeaderDate);

    const cardBodyTitleAnchor = document.createElement("a");

    cardBodyTitleAnchor.href = link;
    cardBodyTitleAnchor.textContent = title;

    const cardBodyTitle = document.createElement("div");

    cardBodyTitle.className = "title";

    cardBodyTitle.appendChild(cardBodyTitleAnchor);

    const cardBodyPublisherAndFormat = document.createElement("div");

    cardBodyPublisherAndFormat.className = "publisher-and-format";
    cardBodyPublisherAndFormat.textContent = `${publisher} / ${format}`;

    const cardBody = document.createElement("div");

    cardBody.appendChild(cardBodyTitle);
    cardBody.appendChild(cardBodyPublisherAndFormat);

    const cardFooterPagesAndIssues = document.createElement("div");

    cardFooterPagesAndIssues.className = "pages-and-issues";

    cardFooterPagesAndIssues.textContent = issues > 1
      ? `${pages} páginas e ${issues} edições`
      : `${pages} páginas e ${issues} edição`;

    const cardFooter = document.createElement("div");

    cardFooter.appendChild(cardFooterPagesAndIssues);

    const card = document.createElement("div");

    card.className = "card";

    if (date === null) {
      card.classList.add("has-ribbon");
      card.classList.add("is-reading");

      const cardRibbon = document.createElement("div");

      cardRibbon.className = "ribbon";
      cardRibbon.textContent = "Lendo";

      card.appendChild(cardRibbon);
    }

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);

    fragment.insertBefore(card, fragment.firstChild);
  }

  const cards = document.createElement("div");

  cards.id = "cards";
  cards.className = "cards";

  cards.appendChild(fragment);

  document
    .getElementById("cards")
    .replaceWith(cards);

  console.timeEnd("render rows");
}

function renderChart(rows, reducer) {
  console.time("render chart");

  const data = rows
    .filter(row => row.date)
    .reduce((acc, row) => {
      const month = MONTHS[row.date.getUTCMonth()];

      acc[month] = (acc[month] || 0) + reducer(row);

      return acc;
    }, {});

  const highest = Object
    .values(data)
    .reduce((acc, value) => value > acc ? value : acc, 0);

  const fragment = document.createDocumentFragment();

  for (const key in data) {
    const value = data[key];
    const dataSerieLabel = document.createElement("span");

    dataSerieLabel.className = "label";
    dataSerieLabel.textContent = key;

    const dataSerieValue = document.createElement("span");

    dataSerieValue.className = "value";
    dataSerieValue.textContent = value;

    const dataSerieBar = document.createElement("progress");

    dataSerieBar.className = "bar";
    dataSerieBar.value = value;
    dataSerieBar.max = highest;

    const dataSerie = document.createElement("div");

    dataSerie.className = "data-serie";

    if (value === 0) {
      dataSerie.classList.add("is-zero")
    }

    dataSerie.appendChild(dataSerieLabel);
    dataSerie.appendChild(dataSerieValue);
    dataSerie.appendChild(dataSerieBar);

    fragment.appendChild(dataSerie);
  }

  const chart = document.createElement("div");

  chart.id = "chart";
  chart.className = "chart";

  chart.appendChild(fragment);

  document
    .getElementById("chart")
    .replaceWith(chart);

  console.timeEnd("render chart");
}

function renderEmptyChart() {
  const emptyChart = document.createElement("div");

  emptyChart.id = "chart";
  emptyChart.className = "chart";

  document
    .getElementById("chart")
    .replaceWith(emptyChart);
}
