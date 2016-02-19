"use strict";

const http = require('http');
const process = require("process");
const fs = require("fs");
const url = require('url');

var urls = process.argv.slice(2).map((u) => {
    return url.parse(u);
}); 

var promises = urls.map(function (u) {
    u.json = true;
    u.headers = {
        'Accept': 'application/json'
    };
    return new Promise(function (resolve, reject) {
        http.get(u, (res) => {
            if (res.statusCode !== 200) {
                reject(res.status);
            }
            let pageData = "";
            res.on("data", (chunk) => {
                pageData += chunk;
            });
            res.on("end", () => {
               let j = JSON.parse(pageData);
               resolve(j); 
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
});

Promise.all(promises).then((responses) => {
    let output = ["<html><head>", "<style>",
        "dt: { display: inline; }",
    "</style>",
     "</head><body>"];
    for (let service of responses) {
        output.push("<section>");
        output.push("<h1>", "Put layer name here", "</h1>");
        for (let layer of service.layers) {
            output.push("<table>");
            output.push("<caption>", layer.layerName, "</caption>");
            for (let legend of layer.legend) {
                output.push("<tr>");
                output.push("<td>", "<img src='data:", legend.contentType, ";base64,", legend.imageData, "' />", "</td>");
                output.push("<td>", legend.label, "</td>");
                output.push("</tr>");
            }
            output.push("</table>");
        }
        output.push("</section>");
    }
    output.push("</body></html>");
    process.stdout.write(output.join(""));
    process.exit();
}, (errors) => {
    console.error(errors);
    process.exit();
});