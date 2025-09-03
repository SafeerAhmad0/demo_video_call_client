FROM node:16-alpine

WORKDIR /app

COPY jwt-server/package*.json ./

RUN npm install

COPY jwt-server/ .

EXPOSE 3001

CMD ["npm", "start"]
