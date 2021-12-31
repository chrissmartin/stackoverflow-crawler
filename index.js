const cheerio = require("cheerio");
const {
  insertMultipleQuestionData,
  deleteAllQuestionData,
  deleteAllVisitedData,
  getLastQueueState,
  saveQueueState,
} = require("./mongo.js");
const {
  extractQuestionData,
  extractPaginationLinks,
} = require("./cheerio-extractors");
const { getHtml } = require("./html-extractors");

// Config
let url = "https://stackoverflow.com/questions";
const baseLink = "https://stackoverflow.com";
const useHeadless = false; // "true" to use playwright (headless for webapps)
const saveThreshold = 200; // Save data to DB when number of questions exceed this threshold
const maxConcurrency = 1; // Each Request fetches 50 questions
let visited = new Set(); // All visited paginated links
let allQuestions = []; // Currently processing extracted question data
let currentQueue = null;
let savedQueueId = null;
let isProcessActive = true;

const crawl = async (url) => {
  console.log("Crawling: ", url);
  visited.add(url);
  const html = await getHtml(url, useHeadless);
  const $ = cheerio.load(html);
  const links = extractPaginationLinks($, baseLink)?.filter(
    (link) => !visited.has(link)
  );
  const content = extractQuestionData($, baseLink);
  if (content.length) {
    allQuestions.push(...content);
  }
  if (links.length) {
    links?.forEach((link) => {
      if (!isProcessActive) {
        return;
      }
      // Push into queue
      currentQueue.enqueue(crawlTask, link);
    });
  }
  console.log("Question Count:", allQuestions.length);
};

// Change the default concurrency or pass it as param
const queue = async (concurrency = 4) => {
  let running = 0;
  const tasks = [];
  return {
    enqueue: async (task, ...params) => {
      tasks.push({ task, params });
      if (running >= concurrency) {
        return;
      }

      ++running;
      while (tasks.length) {
        const { task, params } = tasks.shift();
        await task(...params);
      }
      --running;

      if (running === 0) {
        safeShutdown();
      }
    },
    tasks,
  };
};

const crawlTask = async (url) => {
  if (allQuestions?.length > saveThreshold) {
    await saveQuestionData();
    await saveQueueState(savedQueueId, currentQueue, visited);
  }
  if (!isProcessActive) {
    console.log("Process inactive!");
    return;
  }

  if (visited.has(url)) {
    return;
  }

  await crawl(url);
};

/**
 * Used to wipe clean all collections
 */
async function wipeAllCollections() {
  await deleteAllQuestionData();
  await deleteAllVisitedData();
  process.exit();
}

/**
 * Main Starter Function
 */
async function startCrawler() {
  console.log("Stack Overflow Crawler Started!");
  isProcessActive = true;
  currentQueue = await queue(maxConcurrency);
  const lastQueueState = await getLastQueueState();
  savedQueueId = lastQueueState?._id;
  console.log("lastQueueState:", lastQueueState?.urls);

  // If item in queue, resume task
  if (lastQueueState?.urls?.length) {
    console.log("Resuming from Saved State");
    visited = new Set(lastQueueState?.visited);
    lastQueueState?.urls
      ?.filter((link) => !visited.has(link))
      ?.forEach((savedUrl) => {
        console.log("Queueing:", savedUrl);
        currentQueue.enqueue(crawlTask, savedUrl);
      });
    return;
  }
  // If no item in queue, get last visited item
  if (!lastQueueState?.urls?.length && lastQueueState?.visited?.length) {
    const lastVisitedUrl =
      lastQueueState?.visited[lastQueueState?.visited.length - 1];
    currentQueue.enqueue(crawlTask, lastVisitedUrl);
    return;
  }

  // If no saved states, Start from begining
  currentQueue.enqueue(crawlTask, url);
}

const saveQuestionData = async () => {
  await insertMultipleQuestionData(allQuestions);
  allQuestions = [];
  return;
};

/**
 * Safely Shutdown Process
 */
async function safeShutdown() {
  isProcessActive = false;
  console.log("Exiting please wait!");
  await saveQueueState(savedQueueId, currentQueue, visited);
  await saveQuestionData();
  console.log("Saved!");
  process.exit();
}

/**
 * Safe Shutdown triggers
 */
process
  .on("SIGINT", async () => {
    console.log("SIGINT!");
    await safeShutdown();
  })
  .on("SIGTERM", async () => {
    console.log("SIGTERM!");
    await safeShutdown();
  });

/**
 * Program Start
 */
startCrawler();
// wipeAllCollections();
