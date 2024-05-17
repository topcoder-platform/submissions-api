# Use the base image with Node.js
FROM node:14.21.3

# Copy the current directory into the Docker image
COPY . /submissions-api

# Set working directory for future use
WORKDIR /submissions-api

# Install the dependencies from package.json
RUN npm install
ENV INFORMIXDIR=/submissions-api/node_modules/informixdb/installer/onedb-odbc-driver
ENV LD_LIBRARY_PATH=${INFORMIXDIR}/lib:${INFORMIXDIR}/lib/esql:${INFORMIXDIR}/lib/cli
ENTRYPOINT node app.js
