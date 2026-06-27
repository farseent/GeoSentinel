FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Keep CRA from exiting when there's no TTY (Docker issue)
ENV CI=false

CMD ["npm", "start"]