// Dependencies
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

// Initialize Express
const app = express();
const db = require("./models/Article");
mongoose.connect("mongodb://localhost/oniondb", { useNewUrlParser: true });

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
    res.send("Hello world");
});

axios.get("https://www.theonion.com").then(function(response) {
    let $ = cheerio.load(response.data);
    $(".js_post_item").each(function(i, element) {
        let headline = $(element).find("h4").text();
        let url = $(element).find("a").attr("href");
        let image = $(element).find("img").attr("data-srcset");
        if(!image) image = $(element).find("img").attr("srcset");
        let summary = $(element).find("p").text();

        db.findOne({headline: headline}).then(article => {
            if(article){
                if(summary && !article.summary){
                    db.updateOne({_id: article._id}, {$set: {summary: summary}})
                        .then(article => {console.log(article);})
                        .catch(err => {console.log(err.message);});
                } else {console.log(article);};
            } else {
                db.create({headline: headline, url: url, image: image, summary: summary})
                    .then(article => {console.log(article);})
                    .catch(err => {console.log(err.message);});
            };
        }).catch(err => {console.log(err.message);});
    });
});

// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});
