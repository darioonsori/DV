// Carica i dati e prepara il grafico
document.addEventListener("DOMContentLoaded", function () {
    d3.csv("co2-fossil-plus-land-use.csv").then(data => {
        // Filtra i dati per un anno specifico, ad esempio 2020
        const filteredData = data.filter(d => +d.Year === 2020);

        // Prepara i dati per il grafico
        const chartData = [];
        filteredData.forEach(d => {
            chartData.push({
                source: d.Entity,
                target: "Fossil",
                value: +d["Annual CO₂ emissions"]
            });
            chartData.push({
                source: d.Entity,
                target: "Land",
                value: +d["Annual CO₂ emissions from land-use change"]
            });
        });

        // Crea il grafico alluvionale
        createAlluvialChart(chartData);
    });
});

// Funzione per creare il grafico alluvionale
function createAlluvialChart(data) {
    const svg = d3.select("#chart").append("svg")
        .attr("width", 800)
        .attr("height", 500);

    // Definizione dei nodi e dei collegamenti
    const nodes = [...new Set(data.map(d => d.source).concat(data.map(d => d.target)))];
    const links = data.map(d => ({
        source: nodes.indexOf(d.source),
        target: nodes.indexOf(d.target),
        value: d.value
    }));

    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[1, 1], [799, 499]]);

    const graph = sankey({
        nodes: nodes.map(name => ({ name })),
        links
    });

    // Disegna i rettangoli dei nodi
    svg.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", "steelblue");

    // Disegna i collegamenti
    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "gray")
        .attr("stroke-width", d => d.width);
}

