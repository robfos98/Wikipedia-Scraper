const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');

const www = "https://en.m.wikipedia.org";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const alphabet = "abcdefghijklmnopqrstuvwxyz";

async function run () {
    let links = ["/wiki/Wikipedia:Popular_pages"];
    let wordList = [];
    let frequencyList = [];
    let wordsAdd = [];
    let frequencyAdd = [];

    async function linkChain (depth, already) {
        if (!depth) { return; }
        let promises = [];
        const length = links.length;
        for (already; already < length; already++) {
            promises.push(
                axios.get(www + links[already]).then(response => {
                    const $ = cheerio.load(response.data);
                    $("a").each((i, element) => {
                        const link = element.attribs.href;
                        if (link && link.slice(0,6) == "/wiki/") { links.push(link); }
                    });
                    console.log(links.length);
                })
            );
        }
        await Promise.all(promises)
        await linkChain(depth - 1, already);
    }
    await linkChain(2, 0);

    let repeatLinks = links;
    links = [];
    while (repeatLinks.length) {
        let link = repeatLinks.pop();
        if (links.indexOf(link) == -1) { links.push(link); }
        if (repeatLinks.length % 1000 == 0) { console.log(repeatLinks.length); }
    }

    let promises = [];
    let errors = 0;
    while (links.length) {
        promises.push(axios.get(www + links.pop()).then(function(response) {
            const $ = cheerio.load(response.data);
            const string = $("p").text();
            let word = "";

            for (const char of string) {
                if (char == "," || char == "'") { continue; }
                let letter = ALPHABET.indexOf(char);
                if (letter >= 0) {
                    word += char;
                    continue;
                }
                letter = alphabet.indexOf(char);
                if (letter >= 0) {
                    word += ALPHABET.charAt(letter);
                    continue;
                }
                letter = "0123456789".indexOf(char);
                if (letter >= 0) {
                    word += char;
                    continue;
                }
                if (" \n[].;/-\"!?+=-()".indexOf(char) >= 0) {
                    if (word) {
                        const index = wordsAdd.indexOf(word);
                        if (index < 0) {
                            wordsAdd.push(word);
                            frequencyAdd.push(1);
                        } else { frequencyAdd[index]++; }
                        word = "";
                    }
                }
            }
        }).catch (e => {
            errors++;
            console.error(errors);
            return new Promise(resolve => resolve());
        }));

        if ((links.length) % 100 == 0) {
            await Promise.all(promises);
            while (wordsAdd.length) {
                const word = wordsAdd.pop();
                const frequency = frequencyAdd.pop();
                const index = wordList.indexOf(word);
                if (index < 0) {
                    wordList.push(word);
                    frequencyList.push(frequency);
                } else { frequencyList[index] += frequency; }
            }
            promises = [];
            console.log(links.length + ": " + wordList.length);
        }
    }

    let write = "";
    while (wordList.length) {
        if (frequencyList[wordList.length - 1] > 9) {
            let s = "" + frequencyList.pop();
            s += "            ".slice(s.length, 12);
            write += s + wordList.pop() + "\n";
        } else {
            wordList.pop();
            frequencyList.pop();
        }
        if (wordList.length % 1000 == 0) { console.log(wordList.length); }
    }
    fs.writeFile('Output.txt', write, e => { if (e) throw e; });
}

run();