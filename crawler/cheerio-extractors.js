// Cheerio Extractors
const cheerio = require("cheerio");

/**
 * Extract Question data from each page
 *
 * Extracts: heading, url,vote count, answer count
 */
const extractQuestionData = ($, baseLink) => {
  const questions = $("#questions").children(".question-summary");
  const extractedData = [];
  questions.each(function (i, elm) {
    const heading = $(this).find(".summary > h3 > a").text();
    const voteCount = $(this).find(".vote-count-post strong").text();
    const ansCount = $(this).find(".status strong").text();
    const url = $(this).find(".summary > h3 > a").attr("href");
    extractedData.push({
      heading,
      url: url ? baseLink + url : null,
      voteCount: +voteCount,
      ansCount: +ansCount,
      referenceCount: 0,
    });
  });
  return extractedData;
};

/**
 * Extract Pagination Links from given page
 */
const extractPaginationLinks = ($, baseLink) => [
  ...new Set(
    $("#mainbar > div.s-pagination.site1.themed.pager.float-left > a")
      .map((_, a) => $(a).attr("href"))
      .toArray()
      .map((l) => baseLink + l)
  ),
];

const CheerioExtractors = {
  extractQuestionData,
  extractPaginationLinks,
};
module.exports = CheerioExtractors;
