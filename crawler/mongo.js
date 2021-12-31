const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  QUESTIONS_COLLECTION_NAME,
  QUEUE_COLLECTION_NAME,
} = process.env;

const uri = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
// const uri = `mongodb://root:root@localhost:27017/crawler_db?authSource=admin`;
const client = new MongoClient(uri);

async function getQuestionBankInst() {
  const dbName = DB_NAME ?? "crawler_db";
  const collectionName = QUESTIONS_COLLECTION_NAME ?? "questions_data";

  return await getCollectionInst(dbName, collectionName);
}
async function getVisitedPagesInst() {
  const dbName = DB_NAME ?? "crawler_db";
  const collectionName = QUEUE_COLLECTION_NAME ?? "visited_pages";

  return await getCollectionInst(dbName, collectionName);
}

async function insertMultipleQuestionData(data) {
  if (!data?.length) {
    return;
  }
  try {
    const db = await getQuestionBankInst();
    const bulkUpdateOps = data.map((item) => ({
      updateOne: {
        filter: { url: item.url },
        update: {
          $setOnInsert: {
            heading: item.heading,
            url: item.url,
            voteCount: item.voteCount,
            ansCount: item.ansCount,
            referenceCount: 0,
          },
        },
        upsert: true,
      },
    }));
    const resp = await db.bulkWrite(bulkUpdateOps);
    return;
  } catch (e) {
    console.error(e);
  }
  return;
}

async function saveQueueState(savedQueueId, queue, visited) {
  const queueLinks = queue?.tasks?.map((t) => t?.params[0]);
  if (!queueLinks?.length && !visited.size) {
    return;
  }
  const stateData = {
    urls: queueLinks,
    visited: [...visited],
  };
  try {
    const db = await getVisitedPagesInst();
    const result = await db.updateOne(
      { _id: savedQueueId ?? new ObjectId() },
      { $set: stateData },
      { upsert: true }
    );
    console.log("Save State acknowledged: ", result.acknowledged);
    return result;
  } catch (e) {
    console.error(e);
  }
  return;
}

async function getLastQueueState() {
  try {
    const db = await getVisitedPagesInst();
    const cursor = db.find().sort({ _id: -1 }).limit(1);
    const lastState = (await cursor.toArray())[0];
    return lastState;
  } catch (e) {
    console.error(e);
  }
  return;
}

async function deleteAllQuestionData() {
  try {
    const db = await getQuestionBankInst();
    await db.deleteMany({});
  } catch (e) {
    console.error(e);
  }
  return;
}

async function deleteAllVisitedData() {
  try {
    const db = await getVisitedPagesInst();
    await db.deleteMany({});
  } catch (e) {
    console.error(e);
  }
  return;
}

async function getCollectionInst(dbName, collectionName) {
  try {
    await client.connect();
    return client.db(dbName).collection(collectionName);
  } catch (e) {
    console.error(e);
  }
}

const MongoUtil = {
  insertMultipleQuestionData,
  saveQueueState,
  getLastQueueState,
  deleteAllQuestionData,
  deleteAllVisitedData,
};
module.exports = MongoUtil;
