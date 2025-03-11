FROM node:22

WORKDIR /app

COPY . .


RUN npm install
EXPOSE 2000
CMD ["npm", "run", "dev"] 