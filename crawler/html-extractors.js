// HTML Extractors
const axios = require("axios");
// const playwright = require("playwright");

/**
 * Use headless browsers when extracting from WebApps
 *
 */
const getHtmlByBrowser = async (url) => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();

  return html;
};

/**
 * Use Axios fro http fetch
 *
 */
const getHtmlByAxios = async (url) => {
  const { data } = await axios.get(url);

  return data;
};

/**
 * Return the HTML data for a given URL
 *
 */
const getHtml = async (url, useHeadless = false) => {
  return useHeadless ? await getHtmlByBrowser(url) : await getHtmlByAxios(url);
};

const HtmlExtractors = {
  getHtml,
};
module.exports = HtmlExtractors;
