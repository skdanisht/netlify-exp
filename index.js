const app = require("express")();
const cheerio = require("cheerio");
const axios = require("axios");
const urla = require("url");
const serverless = require('serverless-http');
require("dotenv").config();

const { apiKey } = process.env;
const { ipinfotoken } = process.env;

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home");
});

getData = async (q, hl, num, cr) => {
  const titleSel = "div:nth-child(1) > div > a > h3";
  const linkSel = "div:nth-child(1) > div > a";
  const descSel1 = "div:nth-child(2) > div > span";
  const descSel2 = "div:nth-child(3) > div";
  const descSel3 = "div:nth-child(2) > div";
  const descSel4 = "div:nth-child(3) > div.yXK7lf > span";

  const opt = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36",
    },
  };
  return await axios.get(
    encodeURI(
      `http://api.scraperapi.com?api_key=${apiKey}&country_code=${cr}&url=https://www.google.com/search?q=${q}&hl=${hl}&num=${num}`,
    ),
    opt,
  ).then(({ data }) => {
    let $ = cheerio.load(data);

    var organicResults = Array.from($(".g")).map((el) => {
      const link = $(el).find(linkSel).attr("href");
      const snippet1 = $(el).find(descSel1).text().replace("\n", "") || "";
      const snippet2 = $(el).find(descSel2).text().replace("\n", "") || "";
      const snippet3 = $(el).find(descSel3).text().replace("\n", "") || "";
      const snippet4 = $(el).find(descSel4).text().replace("\n", "") || "";
      const title = $(el).find(titleSel).text();

      if (link) {
        return {
          title,
          link,
          snippet: snippet4 || snippet1 || snippet2 || snippet3,
        };
      }
    });

    var organicResults = organicResults.filter((el) => {
      return el != null;
    });

    var organicResults = organicResults.filter((el) => {
      var host = urla.parse(el.link, true).host;
      return host != null;
    });
    return organicResults;
  });
};

getCr = async (ip) => {
  return await axios.get(`https://ipinfo.io/${ip}?token=${ipinfotoken}`).then(
    ({ data }) => {
      return data.country;
    },
  );
};

app.get("/search", async (req, res) => {
  const { q } = req.query;
  const { hl } = req.query || "en";
  const { num } = req.query || 10;

  app.enable('trust proxy')

  //  const { cr } = req.query || "in";
  const { ip } = req;

  const cr = getCr(ip) || 'us'

  if (q == undefined) {
    await res.redirect("/");
  } else if (q == "") {
    await res.redirect("/");
  } else {
    var data = await getData(q, hl, num, cr);
    await res.render("searchPage", {
      q,
      data: data,
    });
  }
});

app.get("/redirectTo", (req, res) => {
  const { url } = req.query;

  res.redirect(url);
});

module.exports.handler = serverless(app);
