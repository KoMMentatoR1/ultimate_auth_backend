FROM node:19-alpine3.16

ARG DB_PORT=5432 

ENV SMTP_USER=ultimateauthententifi@gmail.com
ENV SMTP_PASSWORD=ovilhlhysaaeszgd
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=465
ENV JWT_ACCESS_SECRET="HACKATHON2023"
ENV JWT_REFTESH_SECRET="REFTESHHACKATHON2023"
ENV CLIENT_URL="http://127.0.0.1:3000"
ENV API_URL="http://188.225.87.70:3001/api"
ENV DB_USER="postgres"
ENV DB_PASS="postgres"
ENV DB_NAME_DEVELOPMENT="auth-database"


RUN apt-get install libfontconfig

WORKDIR /usr/src/app
RUN apt-get update
RUN apt-get install -y build-essential

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start:dev"]