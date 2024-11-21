document.addEventListener("DOMContentLoaded", function () {
    // Mappatura completa dei paesi ai continenti
    const continentMapping = {
        "Africa": "Africa",
        "Asia": "Asia",
        "Europe": "Europe",
        "North America": "North America",
        "South America": "South America",
        "Oceania": "Oceania",
        "Afghanistan": "Asia",
        "Algeria": "Africa",
        "Angola": "Africa",
        "Argentina": "South America",
        "Australia": "Oceania",
        "Austria": "Europe",
        "Bangladesh": "Asia",
        "Belgium": "Europe",
        "Brazil": "South America",
        "Canada": "North America",
        "Chile": "South America",
        "China": "Asia",
        "Colombia": "South America",
        "Cuba": "North America",
        "Denmark": "Europe",
        "Egypt": "Africa",
        "France": "Europe",
        "Germany": "Europe",
        "India": "Asia",
        "Indonesia": "Asia",
        "Italy": "Europe",
        "Japan": "Asia",
        "Kenya": "Africa",
        "Mexico": "North America",
        "Morocco": "Africa",
        "Nigeria": "Africa",
        "Norway": "Europe",
        "Pakistan": "Asia",
        "Peru": "South America",
        "Russia": "Europe",
        "Saudi Arabia": "Asia",
        "South Africa": "Africa",
        "South Korea": "Asia",
        "Spain": "Europe",
        "Sweden": "Europe",
        "Switzerland": "Europe",
        "Thailand": "Asia",
        "Turkey": "Asia",
        "United Kingdom": "Europe",
        "United States": "North America",
        "Vietnam": "Asia",
    };

    // Funzione per determinare il continente
    function getContinent(entity) {
        if (continentMapping[entity]) {
            return continentMapping[entity]; // Restituisce il continente
        } else if (entity.includes("GCP") || entity.includes("excl.") || entity === "World") {
            return null; // Ignora aggregazioni
        } else {
            return "Unknown"; // Fallback per entità non mappate
        }
    }

d3.csv("co2-fossil-plus-land-use.csv").then(data => {
    const year = 2020; // Anno di interesse
    const filteredData = data.filter(d => +d.Year === year);

    // Calcola le emissioni totali per ogni paese
    const emissionsByCountry = {};
    filteredData.forEach(d => {
        const continent = getContinent(d.Entity);
        if (continent && continent !== "Unknown") {
            const totalEmissions = +d["Annual CO₂ emissions"] + +d["Annual CO₂ emissions from land-use change"];
            if (!emissionsByCountry[continent]) emissionsByCountry[continent] = [];
            emissionsByCountry[continent].push({ country: d.Entity, emissions: totalEmissions });
        }
    });

    // Seleziona i primi 5 paesi per emissioni in ogni continente
    const topCountries = {};
    Object.keys(emissionsByCountry).forEach(continent => {
        topCountries[continent] = emissionsByCountry[continent]
            .sort((a, b) => b.emissions - a.emissions)
            .slice(0, 5)
            .map(d => d.country);
    });

    const chartData = [];
    filteredData.forEach(d => {
        const continent = getContinent(d.Entity);
        if (continent && continent !== "Unknown" && topCountries[continent].includes(d.Entity)) {
            // Fossil Emissions
            if (+d["Annual CO₂ emissions"] > 0) {
                chartData.push({
                    source: continent,
                    target: d.Entity,
                    value: +d["Annual CO₂ emissions"],
                    type: "Fossil"
                });
            }
            // Land-Use Emissions
            if (+d["Annual CO₂ emissions from land-use change"] > 0) {
                chartData.push({
                    source: continent,
                    target: d.Entity,
                    value: +d["Annual CO₂ emissions from land-use change"],
                    type: "Land"
                });
            }
        }
    });

    createAlluvialChart(chartData);
}).catch(error => {
    console.error("Errore nel caricamento del CSV:", error);
});


   function createAlluvialChart(data) {
    const width = 800;
    const height = 500;

    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    const nodes = Array.from(new Set(data.map(d => d.source).concat(data.map(d => d.target))))
        .map(name => ({ name }));
    let links = data.map(d => ({
        source: nodes.findIndex(n => n.name === d.source),
        target: nodes.findIndex(n => n.name === d.target),
        value: d.value
    }));

    // Filtra i collegamenti circolari
    links = links.filter(link => link.source !== link.target);

    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(30)
        .extent([[1, 1], [width - 1, height - 1]]);

    const graph = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

   svg.append("g")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => Math.max(1, d.y1 - d.y0))
    .attr("fill", d => d.name in continentMapping ? "#FFD700" : d.name === "Fossil" ? "#FF4500" : "#32CD32")
    .attr("stroke", "#000")
    .append("title")
    .text(d => `${d.name}\n${d.value}`);


    // Disegna i collegamenti
    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => d.type === "Fossil" ? "#FF5733" : "#33FF57")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", d => Math.max(1, d.width))
        .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);
}
});
