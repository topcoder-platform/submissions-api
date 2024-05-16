# Use the base image with Node.js
FROM node:14.21.3

# Copy the current directory into the Docker image
COPY . /submissions-api

# Set working directory for future use
WORKDIR /submissions-api

# Install the dependencies from package.json
RUN npm install
RUN export INFORMIXDIR=/submissions-api/node_modules/informixdb/installer/onedb-odbc-driver
ENTRYPOINT node app.js
