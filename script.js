document.addEventListener("DOMContentLoaded", function () {
    d3.csv("co2-fossil-plus-land-use.csv").then(data => {
        const year = 2020;
        // Filtra i dati per l'anno specifico
        const filteredData = data.filter(d => +d.Year === year);

        // Calcola le emissioni totali per ogni paese
        const totalEmissions = filteredData.map(d => ({
            country: d.Entity,
            total: +d["Annual CO₂ emissions"] + +d["Annual CO₂ emissions from land-use change"]
        }));

        // Ordina e seleziona i primi 10 paesi
        const topCountries = totalEmissions.sort((a, b) => b.total - a.total).slice(0, 10).map(d => d.country);

        // Filtra di nuovo i dati per includere solo i paesi principali
        const chartData = [];
        filteredData.forEach(d => {
            if (topCountries.includes(d.Entity)) {
                if (+d["Annual CO₂ emissions"] > 0) {
                    chartData.push({
                        source: d.Entity,
                        target: "Fossil",
                        value: +d["Annual CO₂ emissions"]
                    });
                }
                if (+d["Annual CO₂ emissions from land-use change"] > 0) {
                    chartData.push({
                        source: d.Entity,
                        target: "Land",
                        value: +d["Annual CO₂ emissions from land-use change"]
                    });
                }
            }
        });

        createAlluvialChart(chartData);
    }).catch(error => {
        console.error("Errore nel caricamento del CSV:", error);
    });
});

function createAlluvialChart(data) {
    const width = 800;
    const height = 500;

    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    const nodes = Array.from(new Set(data.map(d => d.source).concat(data.map(d => d.target))))
        .map(name => ({ name }));
    const links = data.map(d => ({
        source: nodes.findIndex(n => n.name === d.source),
        target: nodes.findIndex(n => n.name === d.target),
        value: d.value
    }));

    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(20) // Aumenta il padding tra i nodi
        .extent([[1, 1], [width - 1, height - 1]]);

    const graph = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    // Disegna i nodi
    svg.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => Math.max(1, d.y1 - d.y0))
        .attr("fill", (d, i) => d.name === "Fossil" ? "#FF5733" : d.name === "Land" ? "#33FF57" : "#3375FF")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .append("title")
        .text(d => `${d.name}\n${d.value}`);

    // Disegna i collegamenti
    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => d.target.name === "Fossil" ? "#FF5733" : "#33FF57")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", d => Math.max(1, d.width))
        .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);
}
