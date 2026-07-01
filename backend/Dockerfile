FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 4000

RUN npm install -g pm2
CMD ["pm2-runtime", "start", "src/index.ts", "--name", "api", "--interpreter", "tsx"]
