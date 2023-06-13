# Use the base image with Node.js
FROM node:12.22.12-buster

# Copy the current directory into the Docker image
COPY . /submissions-api

# Set working directory for future use
WORKDIR /submissions-api

# Install the dependencies from package.json
RUN yarn install
ENTRYPOINT node app.js
