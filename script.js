document.addEventListener("DOMContentLoaded", function () {
    let input = document.getElementById("search");
    let searchButton = document.getElementById("search-button");
    let searchResultContainer = document.getElementById("recipes-box");
    let searchResult = document.getElementById("search-result");
    let searchCount = document.getElementById("search-count");
    let emptyState = document.getElementById("empty-state");
    let pillsContainer = document.getElementById("pills-suggestions");
    let popularRecipesContainer = document.getElementById("recipes");
    let popularIngredientsContainer = document.getElementById("carousel");
    let testimonialList = document.querySelector(".testimonial-list");
    let logo = document.getElementById("logo");

    if (logo) {
        logo.addEventListener("click", function () {
            location.reload();
        });
    }

    searchResult.style.display = "none";
    emptyState.style.display = "none";

    function setLoadingState(isLoading) {
        searchButton.innerHTML = isLoading ? "Searching..." : "Search";
        searchButton.disabled = isLoading;
    }

    function createRecipeElement(meal) {
        let mealElement = document.createElement("div");
        mealElement.classList.add("recipe");

        mealElement.innerHTML = `
            <div class="image-container">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            </div>
            <div class="des-box">
                <h2 class="name-of-meal">${meal.strMeal.slice(0, 30)}</h2>
                <p class="describe">${meal.strInstructions ? meal.strInstructions.slice(0, 60) + "..." : "No description available."}</p>
                <div class="description-box">
                    <div class="left">
                        <i class="fa-regular fa-clock"></i>
                        <p>30 mins</p>
                    </div>
                    <div class="right">
                        <i class="fa-solid fa-web-awesome"></i>
                        <p class="category">${meal.strCategory || "Unknown"}</p>
                    </div>
                </div>
            </div>
        `;

        mealElement.addEventListener("click", () => openRecipeModal(meal));
        return mealElement;
    }

    async function searchRecipe(searchQuery) {
        let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchQuery}`;
    
        setLoadingState(true);
    
        try {
            let response = await fetch(url);
            let data = await response.json();
            let meals = data.meals;
    
            console.log("Meals data:", meals);
    
            
            searchResultContainer.innerHTML = "";
    
            if (!meals) {
                searchResult.style.display = "none";
                emptyState.style.display = "flex";
                searchCount.textContent = "0";
                return;
            }
    
          
            searchCount.textContent = meals.length;
            searchResult.style.display = "flex"; 
            emptyState.style.display = "none"; 

            meals.forEach(meal => {
                let mealElement = createRecipeElement(meal);
                searchResultContainer.appendChild(mealElement);
            });
    
            console.log("Search results updated:");
            console.log(searchResult);
            
    
        } catch (error) {
            console.error("Error fetching meals:", error);
            searchResultContainer.innerHTML = "<p>Something went wrong. Try again.</p>";
        } finally {
            setLoadingState(false);
        }
    }

    searchButton.addEventListener("click", function () {
        let searchQuery = input.value.trim();

        if (searchQuery !== "") {
            searchRecipe(searchQuery);
        } else {
            alert("Please enter a meal");
        }
    });

    async function fetchData(url) {
        try {
            let response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            return null;
        }
    }

    async function loadPopularMeals() {
        let url = `https://www.themealdb.com/api/json/v1/1/random.php`;

        try {
            popularRecipesContainer.innerHTML = "";
            let mealPromises = Array.from({ length: 9 }, () => fetchData(url));

            let mealData = await Promise.all(mealPromises);
            let meals = mealData
                .filter(data => data && data.meals && data.meals.length > 0)
                .map(data => data.meals[0]);

            if (meals.length === 0) throw new Error("No meals found.");

            meals.forEach(meal => {
                let mealElement = createRecipeElement(meal);
                popularRecipesContainer.appendChild(mealElement);
            });

        } catch (error) {
            console.error("Error loading popular meals:", error);
            popularRecipesContainer.innerHTML = "<p>Could not load meals.</p>";
        }
    }

    async function loadPopularIngredients() {
        let url = `https://www.themealdb.com/api/json/v1/1/list.php?i=list`;

        try {
            let data = await fetchData(url);
            let ingredients = data.meals.slice(0, 40);
            popularIngredientsContainer.innerHTML = "";

            ingredients.forEach(ingredient => {
                let ingredientElement = document.createElement("div");
                ingredientElement.classList.add("ingredient");

                ingredientElement.innerHTML = `
                    <div class="image-container">
                        <img src="https://www.themealdb.com/images/ingredients/${ingredient.strIngredient}-Small.png" alt="${ingredient.strIngredient}">
                    </div>
                    <div class="ingredient-name">
                        <h2 class="name-of-meal">${ingredient.strIngredient}</h2>
                    </div>
                `;

                popularIngredientsContainer.appendChild(ingredientElement);
            });

        } catch (error) {
            console.error("Error loading popular ingredients:", error);
            popularIngredientsContainer.innerHTML = "<p>Could not load ingredients.</p>";
        }
    }

    async function loadPopularPills() {
        let mealUrl = `https://www.themealdb.com/api/json/v1/1/random.php`; // Get a random meal
    
        try {
            pillsContainer.innerHTML = "";
            let validPills = new Set();
    
            while (validPills.size < 6) { 
                let data = await fetchData(mealUrl);
    
                if (!data.meals || data.meals.length === 0) continue; // Skip if no meals
    
                let meal = data.meals[0]; // Random meal
    
                // Extract only valid ingredients
                for (let i = 1; i <= 20; i++) {
                    let ingredient = meal[`strIngredient${i}`];
    
                    if (ingredient && ingredient.trim() !== "" && ingredient !== "null") {
                        validPills.add(ingredient.trim());
                    }
    
                    if (validPills.size >= 6) break; // Stop at 6 unique pills
                }
            }
    
            if (validPills.size === 0) {
                pillsContainer.innerHTML = "<p>No valid ingredients found.</p>";
                return;
            }
    
            let shuffledPills = Array.from(validPills).sort(() => Math.random() - 0.5); // Shuffle results
    
            // Render pills
            shuffledPills.forEach(ingredient => {
                let pill = document.createElement("div");
                pill.classList.add("pill");
                pill.textContent = ingredient;
                pill.dataset.search = ingredient;
    
                pill.addEventListener("click", () => {
                    input.value = ingredient;
                    searchRecipe(ingredient);
                });
    
                pillsContainer.appendChild(pill);
            });
    
        } catch (error) {
            console.error("Error loading popular pills:", error);
            pillsContainer.innerHTML = "<p>Could not load popular searches.</p>";
        }
    }

    function slideTestimonials() {
        if (!testimonialList) return;

        const firstTestimonial = testimonialList.firstElementChild;
        firstTestimonial.classList.add("moving");

        setTimeout(() => {
            firstTestimonial.classList.remove("moving");
            testimonialList.appendChild(firstTestimonial);
        }, 150);
    }

    function openRecipeModal(meal) {
        let modal = document.getElementById("recipe-modal");
        let modalContent = document.getElementById("modal-content");
        let recipeLink = meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`;
    
        modalContent.innerHTML = `
            <div class="top-details">
                <h2>${meal.strMeal}</h2>
                <div class="copy" id="copy">
                    <i class="fa-solid fa-copy"></i>
                </div>
            </div>
            <div class="image-container">
                <img id="meal-image" src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <div class="description-box">
                    <div class="left">
                        <i class="fa-regular fa-clock"></i>
                        <p id="time">30 mins</p>
                    </div>
                    <div class="right">
                        <i class="fa-solid fa-web-awesome"></i>
                        <p id="category">${meal.strCategory || "Unknown"}</p>
                    </div>
                </div>
            </div>
            <div class="content-list">
                <div class="ingredients">
                    <h3>Ingredients</h3>
                    <ul id="ingredients-list">
                        ${getIngredientsList(meal)}
                    </ul>
                </div>
                <div class="steps">
                    <h3>Steps</h3>
                    <ol id="steps-list">
                    ${meal.strInstructions.split("\n")
                        .filter(step => step.trim() !== "")
                        .map((step, index) => `<li>${step.replace(/STEP \d+/i, "").trim()}</li>`)
                        .join("")}
                    </ol>
                </div>
            </div>
        `;
    
        modal.style.display = "flex";
    
        let copyButton = document.getElementById("copy");
        copyButton.addEventListener("click", function () {
            navigator.clipboard.writeText(recipeLink).then(() => {
                let icon = copyButton.querySelector("i");
                icon.classList.remove("fa-copy");
                icon.classList.add("fa-check");
                copyButton.style.color = "orange"; 
               
                setTimeout(() => {
                    icon.classList.remove("fa-check");
                    icon.classList.add("fa-copy");
                    copyButton.style.color = ""; 
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy:", err);
            });
        });
    }

    function getIngredientsList(meal) {
        let ingredients = [];
        for (let i = 1; i <= 20; i++) {
            let ingredient = meal[`strIngredient${i}`];
            let measure = meal[`strMeasure${i}`];
            if (ingredient && measure) {
                ingredients.push(`<li>${measure} ${ingredient}</li>`);
            }
        }
        return ingredients.join("");
    }

    function copyRecipeLink(mealId) {
        let recipeLink = `${window.location.origin}/recipe.html?id=${mealId}`;
        navigator.clipboard.writeText(recipeLink)
            .then(() => {
                let copyButton = document.querySelector(".copy");
                if (copyButton) {
                    copyButton.style.color = "orange";
                }
                alert("Link copied to clipboard!");
            })
            .catch(() => alert("Failed to copy link."));
    }
    

    document.addEventListener("click", function (event) {
        let modal = document.getElementById("recipe-modal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    

    loadPopularMeals();
    loadPopularIngredients();
    loadPopularPills();
    setInterval(slideTestimonials, 3500);
    
});

function copyRecipeLink(mealId, button) {
    let recipeLink = `${window.location.origin}/recipe.html?id=${mealId}`;
    
    navigator.clipboard.writeText(recipeLink)
        .then(() => {
            button.style.color = "orange";
            button.innerText = "Copied!";
            
            setTimeout(() => {
                button.innerText = "Copy Link";
                button.style.color = "";
            }, 2000);

            alert("Link copied to clipboard!");
        })
        .catch(() => alert("Failed to copy link."));
}

