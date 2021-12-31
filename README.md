# Stack Overflow Crawler

Features:

- Web Crawler/Scraper which goes through Stack Overflow and fetches all the questions metadata.
- Configurable concurrency of crawler tasks,
- Stores Data into MongoDB
- Saves last queue state on exit, for resuming.

# How to test

Can be run in native nodejs script format or as docker image.

Inorder to connect to an existing mongo server, do update the env vars.

```bash
$ npm install
$ npm run start
```

## Alternative: Docker

After [installing Docker](http://docs.docker.com/), you can run:

```bash
# Builds and Start the local environment (mongo + service)
$ docker compose up -d --build

# Check logs for logs on whats happening
$ docker compose logs -f

# Connect MongoDB Compass for checking the DB more extensively
# Default URI
$ mongodb://root:root@localhost:27017/?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&ssl=false
```
