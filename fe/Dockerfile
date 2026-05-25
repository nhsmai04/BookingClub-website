FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Cổng mặc định của React/Vite
EXPOSE 3000
CMD ["npm", "run", "dev"]