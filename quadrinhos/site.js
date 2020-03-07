const API_KEY = "AIzaSyCI6ZNr9J7ebFAo2sbD4tJi0G8JNr34Gyc";
const SPREADSHEET_ID = "10rvpYl85_2Bh8mtt8Wbg7jDKvZgmOxYOR4EOiduHd0I";

function parseDate(input) {
  const parts = input.split("/");
  const year = parts[2];
  const month = parts[1] - 1;
  const day = parts[0];

  return new Date(year, month, day);
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
      date: parseDate(date),
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

  renderStats(rows);
  renderRows(rows);

  console.timeEnd("rendering");
}

function renderStats(rows) {
  console.time("rendering stats");

  document
    .getElementById("stats-total")
    .innerText = rows.length;

  document
    .getElementById("stats-paper")
    .innerText = rows
      .filter(row => row.format !== "Digital")
      .length;

  document
    .getElementById("stats-digital")
    .innerText = rows
      .filter(row => row.format === "Digital")
      .length;

  const add = (x, y) => x + y;

  const pages = rows
      .map(row => row.pages)
      .reduce(add, 0);

  const issues = rows
      .map(row => row.issues)
      .reduce(add, 0);

  document
    .getElementById("stats-pages")
    .innerText = pages;

  document
    .getElementById("stats-issues")
    .innerText = issues;

  const today = new Date();
  const month = today.getMonth() + 1;

  document
    .getElementById("stats-pages-per-month")
    .innerText = Math.round(pages / month);

  document
    .getElementById("stats-issues-per-month")
    .innerText = Math.round(issues / month);

    console.timeEnd("rendering stats");
}

function renderRows(rows) {
  console.time("rendering rows");

  const cards = document.getElementById("cards");

  for (const { number, date, publisher, title, pages, issues, format, href } of rows) {
    const card = document.createElement("div");

    card.classList.add("card");

    card.innerHTML = `
      <div class="card-header">
          <div class="number">
            <span>#${number}</span>
          </div>
          <div class="date">${date.toLocaleDateString()}</div>
      </div>
      <div class="card-body">
        <div class="title">
          <a href="${href}">${title}</a>
        </div>
        <div class="publisher format">
          ${publisher} / ${format}
        </div>
      </div>
      <div class="card-footer">
          <div class="pages issues">${pages} páginas e ${issues} edições</div>
      </div>
    `;

    cards.insertBefore(card, cards.firstChild);
  }

  console.timeEnd("rendering rows");
}

async function onClientLoad() {
  document
    .getElementById("progress")
    .classList
    .remove("is-invisible");

  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  });

  const today = new Date();
  const year = today.getFullYear();

  render(transform(await get(year)));

  document
    .getElementById("progress")
    .classList
    .add("is-invisible");
}

gapi.load("client", onClientLoad);
