// Store the company database
let companyData = [];

// Stores the companies currently selected
let selectedCompanies = [];
let editingCompanyIndex = null;

// Current metric shown on the graph
let currentMetric = "revenue";

// Lets it know that nothing is currently being dragged
let draggedIndex = null;

// Lets the slider work and have default values
let startYear = 2000;
let endYear = 2026;

// Lets the arrow keys work for search bar
let highlightedIndex = -1;

const MAX_SUGGESTIONS = 7;

const popularCompanies = [
    "Apple",
    "Microsoft",
    "NVIDIA",
    "Amazon",
    "Alphabet"
];

const suggestedCompanies = [

    "Apple",
    "Microsoft",
    "Alphabet",
    "Amazon",
    "NVIDIA"

];

const chartColors = [
    "#4285F4", // Blue
    "#EA4335", // Red
    "#FBBC05", // Yellow
    "#34A853", // Green
    "#A142F4"  // Purple
];

const featuredComparisons = [

    {
        companies: ["Netflix", "Blockbuster"],
        teaser: "The Fall of Movie Rentals."
    },

    {
        companies: ["Apple", "Nokia"],
        teaser: "The Rise of Smartphones."
    },

    {
        companies: ["PepsiCo", "Coca-Cola"],
        teaser: "The Greatest Beverage Rivalry."
    },

    {
        companies: ["NVIDIA", "AMD"],
        teaser: "The Hardware Race for AI."
    },

    {
        companies: ["Amazon", "Walmart"],
        teaser: "Retail Meets E-commerce."
    }

];

// Load the JSON file
fetch("data.json")

    .then(response => response.json())

    .then(data => {

        companyData = data;

        console.log("Database loaded!");

    });

// Grab elements from the page
const emptyGraphMessage = document.getElementById("emptyGraphMessage");
const searchBox = document.getElementById("companySearch");
const searchResults = document.getElementById("searchResults");
const selectedContainer = document.getElementById("selectedCompanies");
const searchWrapper = document.querySelector(".search-wrapper");


// Metric Buttons
const revenueButton = document.getElementById("revenueButton");
const netIncomeButton = document.getElementById("netIncomeButton");

function renderFeaturedComparisons(){

    const recommendationContent = document.getElementById("recommendationContent");

    recommendationContent.innerHTML = "";

    featuredComparisons.forEach(comparison =>{

        const item = document.createElement("div");

        item.classList.add("comparison-item");

        item.addEventListener("click", function(){

            const companiesToAdd = comparison.companies.map(name =>
        
                companyData.find(company => company.displayName === name)
        
            );
        
            selectedCompanies = [...companiesToAdd];
        
            updateSelectedCompanies();
        
            drawChart();
        
        });

        item.innerHTML = `
            <div class="comparison-title">
                <span class="company-name">${comparison.companies[0]}</span>
                <span class="vs-text">vs</span>
                <span class="company-name">${comparison.companies[1]}</span>
            </div>

            <div class="comparison-teaser">
                ${comparison.teaser}
            </div>
        `;

        recommendationContent.appendChild(item);

    });

}

function renderSuggestedCompanies(){

    const recommendationContent = document.getElementById("recommendationContent");

    recommendationContent.innerHTML = "";

    const categoryCounts = getCategoryCounts();

    const categoryQueues = buildCategoryQueues(categoryCounts);

    const playlist = buildCategoryPlaylist(categoryCounts);

    const suggestions = generateSuggestions(
        categoryCounts,
        categoryQueues,
        playlist
    );

    suggestions.forEach(company =>{

        const item = document.createElement("div");

        item.classList.add("suggestion-item");

        item.innerHTML = `
            <span class="suggestion-plus">+</span>

            <span class="suggestion-name">${company.displayName}</span>
        `;

        item.addEventListener("click", function(){

            if(selectedCompanies.some(c => c.displayName === company.displayName)){
        
                return;
        
            }
        
            if(selectedCompanies.length >= 5){
        
                return;
        
            }
        
            selectedCompanies.push(company);
        
            updateSelectedCompanies();
        
            drawChart();
        
        });

        recommendationContent.appendChild(item);

    });

    console.log(suggestions);

}

function buildCategoryQueues(categoryCounts){

    const queues = {};

    // Create an empty array for each category
    Object.keys(categoryCounts).forEach(category =>{

        queues[category] = [];

    });

    // Loop through every company in the database
    companyData.forEach(company =>{

        // Skip companies already selected
        if(selectedCompanies.includes(company)){

            return;

        }

        // Add company to its category queue
        if(queues[company.category]){

            queues[company.category].push(company);

        }

    });

    return queues;

}

function buildCategoryPlaylist(categoryCounts){

    const playlist = [];

    Object.entries(categoryCounts).forEach(([category, count]) =>{

        for(let i = 0; i < count; i++){

            playlist.push(category);

        }

    });

    return playlist;

}

function generateSuggestions(categoryCounts, categoryQueues, playlist){

    const suggestions = [];

    let playlistIndex = 0;

    while(suggestions.length < MAX_SUGGESTIONS){

        if(playlistIndex >= playlist.length){

            playlistIndex = 0;

        }

        const category = playlist[playlistIndex];

        playlistIndex++;

        if(categoryQueues[category] && categoryQueues[category].length > 0){

            const company = categoryQueues[category].shift();

            suggestions.push(company);

        }

        const companiesRemaining = Object.values(categoryQueues)
            .some(queue => queue.length > 0);

        if(!companiesRemaining){

            break;

        }

    }

    // Fill remaining spots with fallback companies
    if(suggestions.length < MAX_SUGGESTIONS){

        const fallbackPool = buildFallbackPool();

        for(const company of fallbackPool){

            if(suggestions.length >= MAX_SUGGESTIONS){

                break;

            }

            if(!suggestions.includes(company)){

                suggestions.push(company);

            }

        }

    }

    return suggestions;

}

function buildFallbackPool(){

    const pool = companyData.filter(company =>
        !selectedCompanies.includes(company)
    );

    // Randomize the order
    pool.sort(() => Math.random() - 0.5);

    return pool;

}

function renderRecommendationPanel(){

    const recommendationTitle = document.getElementById("recommendationTitle");
    const recommendationSubtitle = document.getElementById("recommendationSubtitle");

    if(selectedCompanies.length === 0){

        recommendationTitle.textContent = "Start Exploring";

        recommendationSubtitle.textContent =
            "Discover interesting company comparisons.";

        renderFeaturedComparisons();

    }else{

        recommendationTitle.textContent = "Continue Exploring";

        recommendationSubtitle.textContent =
            "Add similar companies to your comparison.";

        renderSuggestedCompanies();

    }

}

function getCategoryCounts(){

    const categoryCounts = {};

    selectedCompanies.forEach(company =>{

        const category = company.category;

        if(categoryCounts[category]){

            categoryCounts[category]++;

        }else{

            categoryCounts[category] = 1;

        }

    });

    return categoryCounts;

}

function showSearchResults(
    companies,
    editingIndex = null,
    resultsContainer = searchResults
){

    highlightedIndex = -1;

    resultsContainer.innerHTML = "";

    if(companies.length === 0){

        resultsContainer.style.display = "none";
        return;

    }

    resultsContainer.style.display = "block";

    companies.forEach((company, index) => {

        const result = document.createElement("div");

        result.classList.add("search-result");

        result.dataset.index = index;

        // Company Name
        const name = document.createElement("div");

        name.classList.add("search-name");

        name.textContent = company.displayName;

        // Subtitle
        const subtitle = document.createElement("div");

        subtitle.classList.add("search-subtitle");

        subtitle.textContent =
            company.ticker + " • " + company.category;

        result.appendChild(name);

        result.appendChild(subtitle);

        result.addEventListener("click", function(e){

            e.stopPropagation();

            if(selectedCompanies.some((selected, selectedIndex) =>
        
                selected.displayName === company.displayName &&
                selectedIndex !== editingIndex
        
            )){
        
                return;
        
            }
        
            // Editing an existing company
            if(editingIndex !== null){

                selectedCompanies[editingIndex] = company;
            
                editingCompanyIndex = null;
            
                updateSelectedCompanies();
            
                drawChart();
            
                return;
            
            }
            
            if(selectedCompanies.length >= 5){
            
                alert("You can compare up to 5 companies.");
            
                return;
            
            }
            
            selectedCompanies.push(company);
            
            updateSelectedCompanies();
            
            drawChart();
        
            searchBox.value = "";
        
            searchResults.innerHTML = "";
        
            searchResults.style.display = "none";
        
        });

        resultsContainer.appendChild(result);

    });

}

function updateHighlight(){

    const results = document.querySelectorAll(".search-result");

    results.forEach(result =>

        result.classList.remove("active")

    );

    if(highlightedIndex >= 0 && highlightedIndex < results.length){

        results[highlightedIndex].classList.add("active");

    }

}

searchBox.addEventListener("focus", function(){

    if(searchBox.value !== ""){

        return;

    }

    if(selectedCompanies.length === 0){

        const suggestions = companyData.filter(company =>

            popularCompanies.includes(company.displayName)

        );

        showSearchResults(suggestions);

        return;

    }

    const categoryCounts = getCategoryCounts();

    const categoryQueues = buildCategoryQueues(categoryCounts);

    const playlist = buildCategoryPlaylist(categoryCounts);

    const suggestions = generateSuggestions(
        categoryCounts,
        categoryQueues,
        playlist
    );

    showSearchResults(suggestions);

});

// Every time the user types...
searchBox.addEventListener("input", function(){

    // What did they type?
    const searchText = searchBox.value.toLowerCase();

    // Clear old search results
    searchResults.innerHTML = "";
    searchResults.style.display = "none";

    // If nothing was typed, stop
    if(searchText === ""){

        const categoryCounts = getCategoryCounts();
    
        const categoryQueues = buildCategoryQueues(categoryCounts);
    
        const playlist = buildCategoryPlaylist(categoryCounts);
    
        const suggestions = generateSuggestions(
            categoryCounts,
            categoryQueues,
            playlist
        );
    
        showSearchResults(suggestions);
    
        return;
    
    }

    const matches = companyData
        .filter(company => {

            const display = (company.displayName || "").toLowerCase();
            const ticker = String(company.ticker || "").toLowerCase();
            const nickname = (company.nickname || "").toLowerCase();

            return (
                display.includes(searchText) ||
                ticker.includes(searchText) ||
                nickname.includes(searchText)
            );

        })
        .sort((a, b) => {

            function getScore(company){

                const display = (company.displayName || "").toLowerCase();
                const ticker = String(company.ticker || "").toLowerCase();
                const nickname = (company.nickname || "").toLowerCase();

                if(display.startsWith(searchText)) return 1;
                if(ticker.startsWith(searchText)) return 2;
                if(nickname.startsWith(searchText)) return 3;

                if(display.includes(searchText)) return 4;
                if(ticker.includes(searchText)) return 5;
                if(nickname.includes(searchText)) return 6;

                return 7;

            }

            const scoreA = getScore(a);
            const scoreB = getScore(b);

            if(scoreA !== scoreB){

                return scoreA - scoreB;

            }

            return a.displayName.localeCompare(b.displayName);

        });

        const categoryCounts = getCategoryCounts();

        const categoryQueues = buildCategoryQueues(categoryCounts);

        const playlist = buildCategoryPlaylist(categoryCounts);

        const suggestions = generateSuggestions(
            categoryCounts,
            categoryQueues,
            playlist
        );

        const prioritizedSuggestions = suggestions.filter(company => {

            const display = (company.displayName || "").toLowerCase();

            const ticker = String(company.ticker || "").toLowerCase();

            const nickname = (company.nickname || "").toLowerCase();

            return (
                display.startsWith(searchText) ||
                ticker.startsWith(searchText) ||
                nickname.startsWith(searchText)
            );

        });

        const remainingMatches = matches.filter(company =>

            !prioritizedSuggestions.includes(company)

        );

        const finalResults = [
            ...prioritizedSuggestions,
            ...remainingMatches
        ];

        showSearchResults(finalResults);

});

searchBox.addEventListener("keydown", function(e){

    if(e.key !== "Enter"){
        return;
    }

    const firstResult = searchResults.querySelector(".search-result");

    if(!firstResult){
        return;
    }

    e.preventDefault();

    firstResult.click();

});

document.addEventListener("click", function(e){

    if(editingCompanyIndex === null){
        return;
    }

    const editingChip =
        selectedContainer.children[editingCompanyIndex];

    if(!editingChip){
        return;
    }

    if(editingChip.contains(e.target)){
        return;
    }

    cancelEditingCompany();

});

document.getElementById("clearAllButton").addEventListener("click", function(){

    selectedCompanies = [];

    updateSelectedCompanies();

    drawChart();

});

searchBox.addEventListener("keydown", function(event){

    const results = document.querySelectorAll(".search-result");

    if(results.length === 0){

        return;

    }

    if(event.key === "ArrowDown"){

        event.preventDefault();

        highlightedIndex++;

        if(highlightedIndex >= results.length){

            highlightedIndex = 0;

        }

        updateHighlight();

    }

    else if(event.key === "ArrowUp"){

        event.preventDefault();

        highlightedIndex--;

        if(highlightedIndex < 0){

            highlightedIndex = results.length - 1;

        }

        updateHighlight();

    }

    else if(event.key === "Enter"){

        event.preventDefault();

        if(highlightedIndex >= 0){

            results[highlightedIndex].click();

        }

    }

});

// Hide search results when clicking elsewhere
document.addEventListener("click", function(event){

    // If the click wasn't inside the search section...
    if(

        !searchBox.contains(event.target) &&

        !searchResults.contains(event.target)

    ){

        searchResults.innerHTML = "";

        searchResults.style.display = "none";

    }

});

revenueButton.addEventListener("click", function(){

    currentMetric = "revenue";

    revenueButton.classList.add("active");
    netIncomeButton.classList.remove("active");

    drawChart();

});

netIncomeButton.addEventListener("click", function(){

    currentMetric = "netIncome";

    netIncomeButton.classList.add("active");
    revenueButton.classList.remove("active");

    drawChart();

});

// Display the selected companies
function updateSelectedCompanies(refreshRecommendations = true){

    editingCompanyIndex = null;

    // Clear old companies
    selectedContainer.innerHTML = "";

    // Create one chip for each selected company
    selectedCompanies.forEach((company, index) => {

        // Create the company chip
        const chip = document.createElement("div");

        chip.classList.add("company-chip");

        chip.addEventListener("click", function(e){

            // Ignore clicks on the grab handle
            if(e.target.closest(".grab-handle")){
                return;
            }
        
            // Ignore clicks on the X button
            if(e.target.closest(".remove-button")){
                return;
            }
        
            // Don't start editing again if this chip is already being edited
            if(editingCompanyIndex !== null){
                return;
            }
        
            startEditingCompany(index);
        
        });

        // Drag handle
        const grabHandle = document.createElement("span");

        grabHandle.textContent = "⠿";

        grabHandle.classList.add("grab-handle");

        grabHandle.draggable = true;

        grabHandle.addEventListener("dragstart", function(){

            draggedIndex = index;

            chip.classList.add("dragging");

        });

        grabHandle.addEventListener("dragend", function(){

            draggedIndex = null;

            chip.classList.remove("dragging");

        });

        chip.addEventListener("dragover", function(e){

            e.preventDefault();

        });

        chip.addEventListener("drop", function(){

            if(draggedIndex === null || draggedIndex === index){

                return;

            }

            [selectedCompanies[draggedIndex], selectedCompanies[index]] =
            [selectedCompanies[index], selectedCompanies[draggedIndex]];

            updateSelectedCompanies();

            drawChart();

        });

        // Colored dot matching the chart line
        const colorDot = document.createElement("span");

        colorDot.classList.add("company-color-dot");

        colorDot.style.backgroundColor = chartColors[index];

        // Company name
        const companyName = document.createElement("span");

        companyName.textContent = company.displayName;

        // X button
        const removeButton = document.createElement("span");

        removeButton.textContent = "✕";

        removeButton.classList.add("remove-button");

        // Remove company when clicked
        removeButton.addEventListener("click", function(){

            selectedCompanies = selectedCompanies.filter(

                selected => selected.displayName !== company.displayName

            );

            updateSelectedCompanies();

            drawChart();

        });

        // Group the color dot and company name together
        const companyInfo = document.createElement("div");

        companyInfo.classList.add("company-info");

        companyInfo.appendChild(colorDot);
        companyInfo.appendChild(companyName);

        const chipActions = document.createElement("div");

        chipActions.classList.add("chip-actions");

        chipActions.appendChild(grabHandle);
        chipActions.appendChild(removeButton);

        chip.appendChild(companyInfo);
        chip.appendChild(chipActions);

        selectedContainer.appendChild(chip);

    });

    if(selectedCompanies.length >= 5){

        searchWrapper.style.display = "none";
    
        searchResults.innerHTML = "";
        searchResults.style.display = "none";
    
    }else{
    
        searchWrapper.style.display = "block";
    
    }

    if(refreshRecommendations){
        renderRecommendationPanel();
    }

}

function startEditingCompany(index){

    editingCompanyIndex = index;

    const chip = selectedContainer.children[index];

    // Hide the normal company information
    const companyInfo = chip.querySelector(".company-info");

    // Create the editing search box
    const editSearchWrapper = document.createElement("div");

    const editSearchResults = document.createElement("div");

    editSearchResults.classList.add("edit-search-results");

    editSearchWrapper.appendChild(editSearchResults);

    editSearchWrapper.classList.add("edit-search-wrapper");

    chip.classList.add("editing");

    const editSearchBox = document.createElement("input");

    editSearchBox.classList.add("company-search");

    editSearchBox.type = "text";

    editSearchBox.placeholder = "Search a Company...";

    editSearchBox.classList.add("edit-search-box");

    editSearchWrapper.appendChild(editSearchBox);

    // Put the search box at the beginning of the chip
    chip.insertBefore(editSearchWrapper, chip.firstChild);

    // Focus it immediately
    editSearchBox.focus();

    editSearchBox.addEventListener("input", function(){

        const searchText = editSearchBox.value.toLowerCase();
    
        // Clear any old results
        editSearchResults.innerHTML = "";
        editSearchResults.style.display = "none";
    
        if(searchText === ""){
            return;
        }
    
        const matches = companyData
            .filter(company => {
    
                const display = (company.displayName || "").toLowerCase();
                const ticker = String(company.ticker || "").toLowerCase();
                const nickname = (company.nickname || "").toLowerCase();
    
                return (
                    display.includes(searchText) ||
                    ticker.includes(searchText) ||
                    nickname.includes(searchText)
                );
    
            })
            .sort((a, b) => {
    
                function getScore(company){
    
                    const display = (company.displayName || "").toLowerCase();
                    const ticker = String(company.ticker || "").toLowerCase();
                    const nickname = (company.nickname || "").toLowerCase();
    
                    if(display.startsWith(searchText)) return 1;
                    if(ticker.startsWith(searchText)) return 2;
                    if(nickname.startsWith(searchText)) return 3;
    
                    if(display.includes(searchText)) return 4;
                    if(ticker.includes(searchText)) return 5;
                    if(nickname.includes(searchText)) return 6;
    
                    return 7;
                }
    
                return getScore(a) - getScore(b);
    
            });
    
            showSearchResults(
                matches,
                editingCompanyIndex,
                editSearchResults
            );
    
    });

    editSearchBox.addEventListener("keydown", function(e){

        if(e.key === "Escape"){

            e.preventDefault();
    
            cancelEditingCompany();
    
            return;
    
        }

        if(e.key !== "Enter"){
            return;
        }
    
        const firstResult =
            editSearchResults.querySelector(".search-result");
    
        if(!firstResult){
            return;
        }
    
        e.preventDefault();
    
        firstResult.click();
    
    });

}

function cancelEditingCompany(){

    if(editingCompanyIndex === null){
        return;
    }

    editingCompanyIndex = null;

    updateSelectedCompanies(false);

}

const ctx = document.getElementById("financialChart");

const chart = new Chart(ctx, {

    type: "line",

    data: {

        datasets: []

    },

    options: {

        responsive: true,

        interaction: {

            mode: "nearest",

            intersect: true,

            axis: "xy"

        },

        scales: {

            x: {

                type: "time",

                time: {

                    unit: "year"

                }

            },

            y: {

                ticks: {

                    callback: function(value){

                        return formatMoney(value);

                    }

                }

            }

        },

        plugins: {

            legend: {

                display: false

            },

            tooltip: {
                enabled: false,
            
                external: function(context){
            
                    let tooltipEl = document.getElementById("chartjs-custom-tooltip");
            
                    if(!tooltipEl){
            
                        tooltipEl = document.createElement("div");
            
                        tooltipEl.id = "chartjs-custom-tooltip";
            
                        tooltipEl.style.position = "absolute";
                        tooltipEl.style.background = "white";
                        tooltipEl.style.borderRadius = "8px";
                        tooltipEl.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";
                        tooltipEl.style.padding = "10px 12px";
                        tooltipEl.style.pointerEvents = "none";
                        tooltipEl.style.transition = "opacity .1s";
                        tooltipEl.style.fontSize = "12px";
                        tooltipEl.style.lineHeight = "1.5";
                        tooltipEl.style.zIndex = "100";
            
                        document.body.appendChild(tooltipEl);
                    }
            
                    const tooltipModel = context.tooltip;
            
                    if(tooltipModel.opacity === 0){
            
                        tooltipEl.style.opacity = 0;
            
                        return;
                    }
            
                    const dataPoint = tooltipModel.dataPoints[0];
            
                    const dataset = dataPoint.dataset;
            
                    const currentIndex = dataPoint.dataIndex;
            
                    const currentValue = dataPoint.parsed.y;
            
                    let percentageHTML = "";
            
                    if(currentIndex > 0){
            
                        const previousValue =
                            dataset.data[currentIndex - 1].y;
            
                        if(
                            previousValue !== null &&
                            previousValue !== undefined
                        ){
            
                            const percentageChange =
                                ((currentValue - previousValue) / previousValue) * 100;
            
                            const sign =
                                percentageChange > 0 ? "+" : "";
            
                            let changeColor = "#666";
            
                            if(currentValue > previousValue){
                                changeColor = "#16a34a";
                            }
            
                            if(currentValue < previousValue){
                                changeColor = "#dc2626";
                            }
            
                            percentageHTML = `
                                <div style="
                                    color:${changeColor};
                                    margin-top:2px;
                                ">
                                    ${sign}${percentageChange.toFixed(1)}% from previous year
                                </div>
                            `;
                        }
                    }
            
                    const date = new Date(dataPoint.parsed.x).toLocaleDateString(
                        "en-US",
                        {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        }
                    );
            
                    tooltipEl.innerHTML = `
                        <div style="color:#666; margin-bottom:3px;">
                            ${date}
                        </div>
            
                        <div style="color:#222;">
                            ${dataset.label}: ${formatMoney(currentValue)}
                        </div>
            
                        ${percentageHTML}
                    `;
            
                    const chart = context.chart;
            
                    const position = chart.canvas.getBoundingClientRect();
            
                    tooltipEl.style.opacity = 1;
            
                    const pointX =
                        position.left +
                        window.pageXOffset +
                        tooltipModel.caretX;
            
                    const pointY =
                        position.top +
                        window.pageYOffset +
                        tooltipModel.caretY;
            
                    const tooltipWidth = tooltipEl.offsetWidth;
            
                    const tooltipHeight = tooltipEl.offsetHeight;
            
                    const screenWidth = window.innerWidth;
            
                    const gap = 10;
            
                    let tooltipLeft;
            
                    if(pointX > screenWidth / 2){
            
                        // Point is on the right half → tooltip goes left
                        tooltipLeft =
                            pointX -
                            tooltipWidth -
                            gap;
            
                    }else{
            
                        // Point is on the left half → tooltip goes right
                        tooltipLeft =
                            pointX +
                            gap;
            
                    }
            
                    // Prevent the tooltip from going off either edge
                    const minimumLeft = 8;
            
                    const maximumLeft =
                        screenWidth -
                        tooltipWidth -
                        8;
            
                    tooltipLeft =
                        Math.max(
                            minimumLeft,
                            Math.min(tooltipLeft, maximumLeft)
                        );
            
                    tooltipEl.style.left =
                        tooltipLeft + "px";
            
                    tooltipEl.style.top =
                        pointY -
                        tooltipHeight -
                        gap +
                        "px";
                }
            },

        }

    }

});

const yearSlider = document.getElementById("yearSlider");
const startYearLabel = document.getElementById("startYearLabel");
const endYearLabel = document.getElementById("endYearLabel");

noUiSlider.create(yearSlider,{

    start:[2000,2026],

    connect:true,

    step:1,

    tooltips:false,

    format:{

        to: value => Math.round(value),

        from: value => Number(value)

    },

    range:{

        min:2000,

        max:2026

    }

});

yearSlider.noUiSlider.on("slide", function(values){

    startYearLabel.textContent = Math.round(values[0]);
    endYearLabel.textContent = Math.round(values[1]);

});

yearSlider.noUiSlider.on("change", function(values){

    startYear = Math.round(values[0]);
    endYear = Math.round(values[1]);

    startYearLabel.textContent = startYear;
    endYearLabel.textContent = endYear;

    drawChart();

});

// Format large dollar amounts
function formatMoney(value){

    const absValue = Math.abs(value);

    const sign = value < 0 ? "-$" : "$";

    if(absValue >= 1_000_000_000_000){

        return sign + formatNumber(absValue / 1_000_000_000_000) + "T";

    }

    if(absValue >= 1_000_000_000){

        return sign + formatNumber(absValue / 1_000_000_000) + "B";

    }

    if(absValue >= 1_000_000){

        return sign + formatNumber(absValue / 1_000_000) + "M";

    }

    if(absValue >= 1_000){

        return sign + formatNumber(absValue / 1_000) + "K";

    }

    return sign + absValue.toLocaleString();

}

// Removes unnecessary .0 values
function formatNumber(number){

    if(Number.isInteger(number)){

        return number;

    }

    return number.toFixed(1).replace(".0", "");

}

function drawChart(){

    // Remove old lines
    chart.data.datasets = [];

    // If blank?
    if(selectedCompanies.length === 0){

        emptyGraphMessage.style.display = "flex";

        chart.data.datasets = [];

        chart.update();

        return;

    }

    // Hide the message
    emptyGraphMessage.style.display = "none";

    // Create one dataset for every selected company
    selectedCompanies.forEach((company, index) => {

        chart.data.datasets.push({

            label: company.displayName,

            borderColor: chartColors[index],
            
            backgroundColor: chartColors[index],

            data: [...company.financials]

                .filter(item =>

                    item.fiscalYear >= startYear &&
                    item.fiscalYear <= endYear

                )

                .reverse()

                .map(item => ({

                    x: item.fiscalPeriodEnd,

                    y: item[currentMetric]

                })),

            pointRadius: 3,

            pointHoverRadius: 6,

            hitRadius: 14

        });

    });

    chart.update();

}

renderRecommendationPanel();
