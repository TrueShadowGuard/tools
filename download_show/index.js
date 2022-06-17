require("colors")
const input = require("input");
const axios = require("axios");
const {JSDOM} = require("jsdom");
const fs = require("fs/promises");

const baseUrl = "https://2myshows.me";

(async () => {
    try {
        const [serialUrl, serialName] = await getSerialInfo();
        const episodesLinks = await getEpisodesLinks(serialUrl);
        const [fromEpisode, toEpisode] = await getEpisodesRange(episodesLinks);
        const episodesHtmls = await getEpisodesHtml(episodesLinks, fromEpisode, toEpisode);
        const episodesSize = await getEpisodesSize(episodesHtmls[0]);
        downloadVideosFromEpisodes(episodesHtmls, serialName, fromEpisode, episodesSize);
    } catch (e) {
        console.log(e.message.red);
    }
})();

async function getSerialInfo() {
    const serialName = await input.text("Введите название сериала");
    const searchUrl = new URL(baseUrl + "/search/autocomplete");
    searchUrl.searchParams.append("term", serialName);
    const {data} = await axios.get(searchUrl.toString());
    if(data.length === 0) {
        throw new NoSerialWithNameError();
    }
    if(data.length === 1) {
        const serialUrl = baseUrl + data[0].url;
        return [serialUrl, data[0].title];
    }
    if(data.length > 1) {
        const selectedTitle = await input.select("Найдено: ", data.map(d => d.title));
        const serial = data.find(d => d.title = selectedTitle);
        const serialUrl = baseUrl + serial.url;
        return [serialUrl, serial.title];
    }
}

async function getEpisodesLinks(serialUrl) {
    const serialResponse = await axios.get(serialUrl);
    const dom = new JSDOM(serialResponse.data);
    const document = dom.window.document;

    return [...document.querySelectorAll(".b-episodes__item > a")];
}

async function getEpisodesRange(episodesLinks) {
    const from = await input.select('From episode: ', [...new Array(episodesLinks.length)].map((_, i) => String(i + 1)));
    const to = await input.select('To episode: ', [...new Array(episodesLinks.length)].map((_, i) => String(i + 1)));

    return [+from, +to];
}

async function getEpisodesHtml(episodesLinks, fromEpisode, toEpisode) {
    const promises = episodesLinks
        .slice(fromEpisode - 1, toEpisode)
        .map($a => axios.get(baseUrl + $a.href));
    let htmlStrings = await Promise.all(promises);
    htmlStrings = htmlStrings.map(response => response.data);

    return htmlStrings;
}

async function getEpisodesSize(episodeHtml) {
    const dom = new JSDOM(episodeHtml);
    const document = dom.window.document;
    const sizes = [...document.querySelectorAll("video > source")].map($ => $.getAttribute("size"));
    return await input.select("Select videos quality", sizes);
}

async function downloadVideosFromEpisodes(episodesHtmls, serialName, fromEpisode, episodesSize) {

    try {
        await fs.mkdir(`${serialName}`);
    } catch (e) {
        if(e.code !== 'EEXIST') console.error(e);
    }

    for (const htmlString of episodesHtmls) {
        const index = episodesHtmls.indexOf(htmlString);
        const episodeNumber = fromEpisode + index;
        console.log("started downloading episode " + episodeNumber);
        const dom = new JSDOM(htmlString);
        const document = dom.window.document;

        const src = [...document.querySelectorAll("video > source")]
            .find($ => $.getAttribute("size") === episodesSize).src;
        if(!src) console.log("no src for " + episodesSize);

        const {data} = await axios.get(src, {
            responseType: "stream"
        });
        fs.writeFile(`${serialName}/${episodeNumber}.mp4`, data)
    }

}

class NoSerialWithNameError extends Error {
    constructor() {
        super();
        this.name = "NoSerialWithNameError";
        this.message = "Serial not found";
    }
}
