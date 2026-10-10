// Käyntikortit: people on a course page (mock data + rendering).
// - Shared courses are computed as the intersection of the person's and the
//   current user's courses, leaving out the course being viewed.
// - The list is sorted by shared courses, then by year of study (same year
//   as the current user first), then by name.
// Load before main.js, so main.js can wire up the rendered card buttons.
// Wrapped in a function so its names don't leak into the global scope.

(() => {
// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

// The logged-in user. Courses in the order of the Kurssit page.
const currentUser = {
  nimi: "Elina",
  vuosikurssi: 1,
  kurssit: [
    "Johdanto digitaalisiin palveluihin",
    "Johdanto ohjelmistokehitykseen",
    "Digistartti",
    "Johdanto opiskeluun",
    "Ammatillinen viestintä",
    "Tekoälyn perusteet",
  ],
};

// People open to questions, per course. `suorittanutKurssin` refers to the
// course they are listed under. `kortti` = id of their full-card modal.
const coursePeople = {
  "Johdanto digitaalisiin palveluihin": [
    {
      nimi: "Risto Järvenpää",
      vuosikurssi: 2,
      suorittanutKurssin: false,
      kurssit: [
        "Johdanto digitaalisiin palveluihin",
        "Digistartti",
        "Johdanto opiskeluun",
        "Johdanto ohjelmistokehitykseen",
        "Ohjelmoinnin perusteet",
      ],
      kortti: "kayntikortti",
    },
    {
      nimi: "Topias Frost",
      vuosikurssi: 1,
      suorittanutKurssin: false,
      kurssit: [
        "Johdanto digitaalisiin palveluihin",
        "Digistartti",
        "Tekoälyn perusteet",
      ],
    },
    {
      nimi: "Saara Järvenpää",
      vuosikurssi: 3,
      suorittanutKurssin: true,
      kurssit: [
        "Johdanto digitaalisiin palveluihin",
        "Digistartti",
        "Palvelumuotoilu",
      ],
    },
    {
      nimi: "Marja Huurre",
      vuosikurssi: 1,
      suorittanutKurssin: false,
      kurssit: ["Johdanto digitaalisiin palveluihin", "Johdanto opiskeluun"],
    },
    {
      nimi: "Oona Kiviniemi",
      vuosikurssi: 4,
      suorittanutKurssin: true,
      kurssit: ["Johdanto digitaalisiin palveluihin", "Käyttäjätutkimus"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Shared courses in the current user's course order, without the course
// being viewed.
function sharedCourses(person, currentCourse) {
  return currentUser.kurssit.filter(
    (course) => course !== currentCourse && person.kurssit.includes(course)
  );
}

function yearText(person) {
  const year = `${person.vuosikurssi}. vuoden opiskelija`;
  return person.suorittanutKurssin ? `${year} · Suorittanut kurssin` : year;
}

// List item: at most two names, then "+ 1 muu" / "+ N muuta".
function sharedSummary(courses) {
  const shown = courses.slice(0, 2).join(", ");
  const rest = courses.length - 2;
  if (rest <= 0) return `Yhteiset kurssit: ${shown}`;
  return `Yhteiset kurssit: ${shown} + ${rest} ${rest === 1 ? "muu" : "muuta"}`;
}

function sortPeople(people, currentCourse) {
  const yearDistance = (person) =>
    Math.abs(person.vuosikurssi - currentUser.vuosikurssi);
  return [...people].sort(
    (a, b) =>
      sharedCourses(b, currentCourse).length -
        sharedCourses(a, currentCourse).length ||
      yearDistance(a) - yearDistance(b) ||
      a.nimi.localeCompare(b.nimi, "fi")
  );
}

function span(className, text) {
  const element = document.createElement("span");
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

// Same markup as the original static person cards.
function renderPersonCard(person, currentCourse) {
  const card = document.createElement(person.kortti ? "button" : "div");
  card.className = "card person-card";
  if (person.kortti) {
    card.type = "button";
    card.dataset.modalOpen = person.kortti;
  }

  const head = span("person-card__head");
  const text = document.createElement("span");
  text.append(
    span("person-card__name", person.nimi),
    span("person-card__status", yearText(person)),
    span("person-card__status", "Avoin kysymyksille")
  );
  head.append(span("avatar"), text);
  card.append(head);

  const shared = sharedCourses(person, currentCourse);
  if (shared.length > 0) {
    card.append(span("person-card__note", sharedSummary(shared)));
  }

  const item = document.createElement("li");
  item.append(card);
  return item;
}

// Full card (modal): year line and all shared courses.
function fillFullCard(person, currentCourse) {
  const dialog = document.getElementById(person.kortti);
  if (!dialog) return;
  dialog.querySelector("[data-card-year]").textContent = yearText(person);

  const shared = sharedCourses(person, currentCourse);
  const block = dialog.querySelector("[data-card-courses]");
  const list = block.querySelector("ul");
  list.replaceChildren(
    ...shared.map((course) => {
      const item = document.createElement("li");
      item.textContent = course;
      return item;
    })
  );
  block.hidden = shared.length === 0;
}

// ---------------------------------------------------------------------------
// Render every list marked with data-people-for="<course name>"
// ---------------------------------------------------------------------------

document.querySelectorAll("[data-people-for]").forEach((list) => {
  const currentCourse = list.dataset.peopleFor;
  const people = sortPeople(coursePeople[currentCourse] || [], currentCourse);
  list.replaceChildren(
    ...people.map((person) => renderPersonCard(person, currentCourse))
  );
  people
    .filter((person) => person.kortti)
    .forEach((person) => fillFullCard(person, currentCourse));
});
})();
