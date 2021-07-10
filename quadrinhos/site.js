const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const TODAY = new Date();

window.onload = window.onpopstate = init;

async function init() {
  let year = TODAY.getUTCFullYear();

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

  const response = await fetch("https://quadrinhos-xmu2mzvdvq-uc.a.run.app/" + year);
  const json = await response.json();

  console.timeEnd("get");

  return json;
}

function transform(comicBooks) {
  console.time("transform");

  const arr = comicBooks.map((comicBook, index) => {
    const {
      date, publisher, title, pages, issues, format, link = "#"
     } = comicBook;

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

  return arr;
}

function render(comicBooks) {
  console.time("render");

  renderStats(comicBooks);
  renderEmptyChart();
  renderCards(comicBooks);

  console.timeEnd("render");
}

function renderStats(comicBooks) {
  console.time("render stats");

  const data = comicBooks.filter(comicBook => comicBook.date);
  const totalOfPages = data.reduce((acc, comicBook) => acc + comicBook.pages, 0);
  const totalOfIssues = data.reduce((acc, comicBook) => acc + comicBook.issues, 0);

  const statsTotal = document.getElementById("stats-total");

  statsTotal.textContent = data.length;
  statsTotal.addEventListener("click", () => renderChart(data, () => 1));

  const statsPaper = document.getElementById("stats-paper");

  statsPaper.textContent = data
    .filter(comicBook => comicBook.format !== "Digital")
    .length;

  statsPaper.addEventListener("click", () => renderChart(data, comicBook => comicBook.format !== "Digital" ? 1 : 0));

  const statsDigital = document.getElementById("stats-digital");

  statsDigital.textContent = data
    .filter(comicBook => comicBook.format === "Digital")
    .length;

  statsDigital.addEventListener("click", () => renderChart(data, comicBook => comicBook.format === "Digital" ? 1 : 0));

  const statsPages = document.getElementById("stats-pages");

  statsPages.textContent = totalOfPages;
  statsPages.addEventListener("click", () => renderChart(data, comicBook => comicBook.pages));

  const statsIssues = document.getElementById("stats-issues");

  statsIssues.textContent = totalOfIssues;
  statsIssues.addEventListener("click", () => renderChart(data, comicBook => comicBook.issues));

  const statsPagesPerMonth = document.getElementById("stats-pages-per-month");

  statsPagesPerMonth.textContent = Math.round(totalOfPages / (TODAY.getUTCMonth() + 1));

  const statsIssuesPerMonth = document.getElementById("stats-issues-per-month");

  statsIssuesPerMonth.textContent = Math.round(totalOfIssues / (TODAY.getUTCMonth() + 1));

  console.timeEnd("render stats");
}

function renderCards(comicBooks) {
  console.time("render cards");

  const fragment = document.createDocumentFragment();
  const template = document.getElementById("card");

  for (const { number, date, publisher, title, pages, issues, format, link } of comicBooks) {
    const card = template.content.cloneNode(true);

    if (date === null) {
      card.firstElementChild.classList.add("has-ribbon");
    }

    const cardNumber = card.querySelector(".number");

    cardNumber.textContent = `#${number}`;

    const cardDate = card.querySelector(".date");

    cardDate.textContent = date
        ? `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`
        : "...";

    const cardTitle = card.querySelector(".title a");

    cardTitle.href = link;
    cardTitle.textContent = title;

    const cardPublisherAndFormat = card.querySelector(".publisher-and-format");

    cardPublisherAndFormat.textContent = `${publisher} / ${format}`;

    const cardPageAndIssues = card.querySelector(".pages-and-issues");

    cardPageAndIssues.textContent = issues > 1
        ? `${pages} páginas e ${issues} edições`
        : `${pages} páginas e ${issues} edição`;

    fragment.insertBefore(card, fragment.firstChild);
  }

  const cards = document.getElementById("cards");

  cards.replaceChildren(fragment);

  console.timeEnd("render cards");
}

function renderChart(comicBooks, reducer) {
  console.time("render chart");

  const data = comicBooks
    .filter(comicBook => comicBook.date)
    .reduce((acc, comicBook) => {
      const month = MONTHS[comicBook.date.getUTCMonth()];

      acc[month] = (acc[month] || 0) + reducer(comicBook);

      return acc;
    }, {});

  const highest = Object
    .values(data)
    .reduce((acc, value) => value > acc ? value : acc, 0);

  const fragment = document.createDocumentFragment();
  const template = document.getElementById("data-serie");

  for (const key in data) {
    const value = data[key];
    const dataSerie = template.content.cloneNode(true);

    if (value === 0) {
      dataSerie.firstElementChild.classList.add("is-zero")
    }

    const dataSerieLabel = dataSerie.querySelector(".label");

    dataSerieLabel.textContent = key;

    const dataSerieValue = dataSerie.querySelector(".value");

    dataSerieValue.textContent = value;

    const dataSerieBar = dataSerie.querySelector(".bar");

    dataSerieBar.value = value;
    dataSerieBar.max = highest;

    fragment.appendChild(dataSerie);
  }

  chart.replaceChildren(fragment);

  console.timeEnd("render chart");
}

function renderEmptyChart() {
  const emptyFragment = document.createDocumentFragment();
  const chart = document.getElementById("chart");

  chart.replaceChildren(emptyFragment);
}
