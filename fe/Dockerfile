# --- GIAI ĐOẠN 1: Dùng Node để build code thành file tĩnh ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

# --- GIAI ĐOẠN 2: Dùng Nginx siêu nhẹ để phục vụ trang web ---
FROM nginx:alpine

# 1. Ghi đè file cấu hình mặc định của Nginx bằng file của bạn
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Copy các file tĩnh đã build từ Giai đoạn 1 sang thư mục gốc của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]