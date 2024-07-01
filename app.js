// CONSTANTS

const FILTERS = [
  {
    name: "area",
    short: "a",
    code: "strArea",
  },
  {
    name: "category",
    short: "c",
    code: "strCategory",
  },
  {
    name: "ingredients",
    short: "i",
    code: "strIngredient",
  },
];

// Load page at startup
document.addEventListener("DOMContentLoaded", () => {
  loadRecommandation();
  loadFilters();
  loadAmazon();

  document.getElementById("searchbar-form").addEventListener("submit", (e) => {
    e.preventDefault();
    search();
  });
});

function loadMoreSearchResult(query, last_result_index) {
  // Research and start at the last items position
  search(query, 5, last_result_index);
}

function getYTidFromLink(link) {
  return link.split("=")[1];
}

function getHtmlParsedIngredient(data) {
  let htmlParsedIngr = "";

  for (let i = 1; i <= 20; i++) {
    let ingrName = data[`strIngredient${i}`];
    let ingrQts = data[`strMeasure${i}`];

    if (ingrName == "" || ingrName == null) {
      break;
    }

    htmlParsedIngr += `
            <div class="ingredient">
                <img src="https://www.themealdb.com/images/ingredients/${encodeURIComponent(ingrName)}.png" alt="">
                <div class="ingredient-details">
                    <p class="ingredient-title">${ingrName}</p>
                    <p class="ingredient-mesures">${ingrQts}</p>
                </div>
            </div>`;
  }

  return htmlParsedIngr;
}

async function loadDetailsPopup(id) {
  console.log("Details popup id: ", id);

  // DOM Elements
  let page_content = document.getElementById("page-content");
  let popup = document.querySelector(".details-popup-container");

  // Fetch data from https://www.themealdb.com/api/json/v1/1/lookup.php?i=id
  let data = await fetchApi(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);

  // Check data integrity
  if (!data && !data.meals) {
    return;
  }

  data = data.meals[0];

  // Add data to page
  popup.innerHTML = `
        <div class="popup-content">
            <div class="close-btn-container">
                <button onclick="closePopup()">X</button>
            </div>
            <div class="popup-header">
                <img src="${data.strMealThumb}">
                <div class="popup-header-content">
                    <h3 class="meal-title">${data.strMeal}</h3>
                    <div class="tags-container">
                        <p class="tag">${data.strArea}</p>
                        <p class="tag">${data.strCategory}</p>
                    </div>
                </div>
            </div>
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/${getYTidFromLink(data.strYoutube)}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
            <div class="row">
                <div class="col ingredients-container">
                    ${getHtmlParsedIngredient(data)}
                </div>
                <div class="col recepie">
                    <p>${data.strInstructions}</p>
                </div>
            </div>
        </div>`;

  // Reveal data
  // page_content.classList.add("popup-open");
  popup.classList.remove("hidden");
}

function closePopup() {
  // document.getElementById("page-content").classList.remove("popup-open");
  document.querySelector(".details-popup-container").classList.add("hidden");
}

async function search(query = "", result_amount = 5, first_result_index = 0) {
  // Getting all DomElements
  let searchbar = document.getElementById("query");
  let searchResult = document.getElementById("search-result");
  let searchActions = document.getElementById("search-action-container");
  let isButton = false;

  // Asign searchbar value to the query if it exist
  query = searchbar.value ? searchbar.value : query;

  // Prevent the query to be empty
  if (query == "") {
    return (searchResult.innerHTML = "Your search is empty...");
  }

  // Fetch the Api DATA with the query
  let data = await fetchApi(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);

  // Prevent null data reading
  if (!data.meals) {
    return;
  } else if (!data.meals[first_result_index]) {
    return (searchActions.innerHTML = `<button onclick="loadMoreSearchResult('${query}',0)">Go back</button>`);
  }

  // Reseting DOM
  searchbar.value = "";
  searchResult.innerHTML = "";

  // Inserting into the DOM all results

  for (let i = first_result_index; i < result_amount + first_result_index; i++) {
    // Check if the search result exist if not add a go back btn
    if (!data.meals[i]) {
      isButton = true;
      searchActions.innerHTML = `<button onclick="loadMoreSearchResult('${query}',0)">Go back</button>`;
      break;
    }

    // Result printing
    searchResult.innerHTML += `
            <div class="result" onclick="loadDetailsPopup(${data.meals[i].idMeal})">
                <img src="${data.meals[i].strMealThumb}">
                <div class="search-item-details">
                    <h4 class="search-result-item">${data.meals[i].strMeal}</h4>
                    <div class="details-wraper">
                        <p class="tag">${data.meals[i].strArea}</p>
                        <p class="tag">${data.meals[i].strCategory}<p>
                    </div>
                </div>
            </div>
        `;

    // If the current data is the last one, set the action button to Go back
    if (data.meals.length - 1 <= i) {
      isButton = true;
      searchActions.innerHTML = `<button onclick="loadMoreSearchResult('${query}',0)">Go back</button>`;
    }
  }

  // Add a load more btn
  if (!isButton) {
    searchActions.innerHTML = `<button onclick="loadMoreSearchResult('${query}',${first_result_index + result_amount})">Load more...</button>`;
  }

  // Clear the actions section if no utility
  if (data.meals.length <= result_amount) {
    searchActions.innerHTML = "";
  }

  // In case of recall, empty the current data.
  data = [];
}

async function loadRecommandation() {
  // Get the DOM elements
  let recomandationContainer = document.getElementById("recomandation");

  // Fetch the api
  let data = await fetchApi("https://www.themealdb.com/api/json/v1/1/random.php");

  // handle empty data
  if (data == {} || !data.meals) {
    return;
  }

  // Insert the data into the dom
  recomandationContainer.innerHTML = `
        <img src="${data.meals[0].strMealThumb}" alt="" id="recomandation-image">
        <div class="recomandation-details">
            <h3 id="recomandation-title">${data.meals[0].strMeal}</h3>
            <button onclick="loadDetailsPopup(${data.meals[0].idMeal})">Get recipe</button>
        </div>
    `;
}

async function fetchApi(uri) {
  try {
    const reponse = await fetch(uri);
    return await reponse.json();
  } catch (err) {
    console.error(err);
    return {};
  }
}

async function loadFilters() {
  FILTERS.forEach(async (filter) => {
    let filterSelect = document.getElementById(`${filter.name}-select`);
    let filterOptions = await fetchApi(`https://www.themealdb.com/api/json/v1/1/list.php?${filter.short}=list`);
    if (!filterOptions || !filterOptions.meals) {
      return;
    }
    filterOptions = filterOptions.meals;
    filterOptions.forEach((option) => {
      filterSelect.innerHTML += `
                <option value="${option[filter.code]}">${option[filter.code]}</option>
            `;
    });
  });
}

async function loadAmazon(filter = null) {
  let mealsContainer = document.getElementById("meals-container");
  mealsContainer.innerHTML = "Loading ...";

  if (filter === null) {
    let meal = await fetchApi("https://www.themealdb.com/api/json/v1/1/random.php");
    mealsContainer.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      if (meal == null) {
        meal = await fetchApi("https://www.themealdb.com/api/json/v1/1/random.php");
      }
      if (!meal || !meal.meals) {
        return (mealsContainer.innerHTML = "There is nothing here !");
      }
      meal = meal.meals[0];
      mealsContainer.innerHTML += getHtmlParsedMeal(meal);
      meal = null;
    }
    return;
  }

  let select = document.getElementById(`${FILTERS[filter].name}-select`);
  if (select.value == "") {
    return loadAmazon();
  }
  let meals = await fetchApi(`https://www.themealdb.com/api/json/v1/1/filter.php?${FILTERS[filter].short}=${select.value}`);
  if (!meals || !meals.meals) {
    return (mealsContainer.innerHTML = "There is nothing here !");
  }
  meals = meals.meals;
  mealsContainer.innerHTML = "";
  meals.forEach((meal) => {
    mealsContainer.innerHTML += getHtmlParsedMeal(meal);
  });
}

function getHtmlParsedMeal(meal) {
  return `
        <div class="meal" onclick="loadDetailsPopup(${meal.idMeal})">
            <img src="${meal.strMealThumb}">
            <div class="name-container">
                <p>${meal.strMeal}</p>
            </div>
        </div>
    `;
}
