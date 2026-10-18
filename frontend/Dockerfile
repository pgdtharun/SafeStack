FROM node:20-alpine

WORKDIR /app

# Copy dependency specifications first for Docker layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy frontend source
COPY . .

EXPOSE 5173

# run vite dev server for outside connections
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
