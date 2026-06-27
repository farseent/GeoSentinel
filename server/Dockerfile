FROM node:20-alpine

WORKDIR /app

# Copy package files first (layer cache — npm install only re-runs if these change)
COPY package*.json ./

RUN npm install --production

# Copy rest of source
COPY . .

EXPOSE 5000

CMD ["npm", "start"]