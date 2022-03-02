FROM node:17-alpine
WORKDIR /opt/app
COPY app/package.json app/package-lock.json ./
RUN npm ci
RUN npm install --global serve
COPY app/ ./
RUN npm run build
CMD ["serve", "--single", "build"]
