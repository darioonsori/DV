document.addEventListener("DOMContentLoaded", function () {
    // Carica i dati dal CSV
    d3.csv("co2-fossil-plus-land-use.csv").then(data => {
        // Filtra i dati per un anno specifico (ad esempio 2020)
        const year = 2020;
        const filteredData = data.filter(d => +d.Year === year);

        // Prepara i dati per il grafico alluvionale
        const chartData = [];
        filteredData.forEach(d => {
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
        });

        // Crea il grafico
        createAlluvialChart(chartData);
    }).catch(error => {
        console.error("Errore nel caricamento del CSV:", error);
    });
});

// Funzione per creare il grafico alluvionale
function createAlluvialChart(data) {
    // Definizione della dimensione del grafico
    const width = 800;
    const height = 500;

    // Seleziona il div e aggiunge un elemento SVG
    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Definizione dei nodi e dei collegamenti
    const nodes = Array.from(new Set(data.map(d => d.source).concat(data.map(d => d.target))))
        .map(name => ({ name }));
    const links = data.map(d => ({
        source: nodes.findIndex(n => n.name === d.source),
        target: nodes.findIndex(n => n.name === d.target),
        value: d.value
    }));

    // Creazione del layout Sankey
    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
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
        .attr("height", d => Math.max(1, d.y1 - d.y0)) // Imposta altezza minima a 1
        .attr("fill", "steelblue")
        .append("title")
        .text(d => `${d.name}\n${d.value}`);

    // Disegna i collegamenti
    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "gray")
        .attr("stroke-width", d => Math.max(1, d.width))
        .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);
}
