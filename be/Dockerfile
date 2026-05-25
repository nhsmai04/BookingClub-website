FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose cổng backend
EXPOSE 5001
CMD ["npm", "run", "dev"]