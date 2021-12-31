FROM node:14

WORKDIR /crawler
COPY package.json .
RUN npm install
COPY . .
CMD npm run start