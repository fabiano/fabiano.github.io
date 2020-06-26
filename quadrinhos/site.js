const API_KEY = "AIzaSyCI6ZNr9J7ebFAo2sbD4tJi0G8JNr34Gyc";
const SPREADSHEET_ID = "10rvpYl85_2Bh8mtt8Wbg7jDKvZgmOxYOR4EOiduHd0I";
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

gapi.load("client", onClientLoad);

async function onClientLoad() {
  document.body.classList.add("is-loading");

  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  });

  const today = new Date();
  const year = today.getFullYear();

  render(transform(await get(year)));

  document.body.classList.remove("is-loading");
}

async function get(year) {
  console.time("getting");

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${year}!A2:G`,
  });

  console.timeEnd("getting");

  return response.result.values;
}

function transform(rows) {
  console.time("transforming");

  const tmp = rows.map((row, index) => {
    const [
      date, publisher, title, pages, issues, format, href = "#"
    ] = row;

    return {
      number: index + 1,
      date,
      publisher,
      title,
      pages: parseInt(pages, 10),
      issues: parseInt(issues, 10),
      format,
      href,
    };
  });

  console.timeEnd("transforming");

  return tmp;
}

function render(rows) {
  console.time("rendering");

  const read = rows.filter(row => row.date);

  renderStats(read);
  renderChart(read);
  renderRows(rows);

  console.timeEnd("rendering");
}

function renderStats(rows) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const add = (x, y) => x + y;

  console.time("rendering stats");

  const total = document.getElementById("stats-total");

  total.textContent = rows.length;

  const paper = document.getElementById("stats-paper");

  paper.textContent = rows
    .filter(row => row.format !== "Digital")
    .length;

  const digital = document.getElementById("stats-digital");

  digital.textContent = rows
    .filter(row => row.format === "Digital")
    .length;

  const pages = document.getElementById("stats-pages");

  const totalOfPages = rows
    .map(row => row.pages)
    .reduce(add, 0);

  pages.textContent = totalOfPages;

  const issues = document.getElementById("stats-issues");

  const totalOfIssues = rows
    .map(row => row.issues)
    .reduce(add, 0);

  issues.textContent = totalOfIssues;

  const pagesPerMonth = document.getElementById("stats-pages-per-month");

  pagesPerMonth.textContent = Math.round(totalOfPages / month);

  const issuesPerMonth = document.getElementById("stats-issues-per-month");

  issuesPerMonth.textContent = Math.round(totalOfIssues / month);

  console.timeEnd("rendering stats");
}

function renderChart(rows) {
  console.time("rendering chart");

  const data = rows.reduce((acc, row) => {
    const month = MONTHS[parseInt(row.date.slice(3, 5), 10) - 1];

    acc[month] = (acc[month] || 0) + 1;

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

    dataSerie.appendChild(dataSerieLabel);
    dataSerie.appendChild(dataSerieValue);
    dataSerie.appendChild(dataSerieBar);

    fragment.appendChild(dataSerie);
  }

  const chart = document.getElementById("chart");

  chart.appendChild(fragment);

  console.timeEnd("rendering chart");
}

function renderRows(rows) {
  console.time("rendering rows");

  const fragment = document.createDocumentFragment();

  for (const { number, date, publisher, title, pages, issues, format, href } of rows) {
    const cardHeaderNumber = document.createElement("div");

    cardHeaderNumber.className = "number";
    cardHeaderNumber.textContent = `#${number}`;

    const cardHeaderDate = document.createElement("div");

    cardHeaderDate.className = "date";
    cardHeaderDate.textContent = date ? date : "...";

    const cardHeader = document.createElement("div");

    cardHeader.appendChild(cardHeaderNumber);
    cardHeader.appendChild(cardHeaderDate);

    const cardBodyTitleAnchor = document.createElement("a");

    cardBodyTitleAnchor.href = href;
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
    cardFooterPagesAndIssues.textContent = `${pages} páginas e ${issues} edições`;

    const cardFooter = document.createElement("div");

    cardFooter.appendChild(cardFooterPagesAndIssues);

    const card = document.createElement("div");

    card.className = "card";

    if (date === "") {
      card.classList.add("has-ribbon");

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

  const cards = document.createElement("cards");

  cards.id = "cards";
  cards.className = "cards";

  cards.appendChild(fragment);

  document
    .getElementById("cards")
    .replaceWith(cards);

  console.timeEnd("rendering rows");
}
