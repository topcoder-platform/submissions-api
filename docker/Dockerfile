# Use the base image with Node.js 8.11.3
FROM node:8.17.0

# Copy the current directory into the Docker image
COPY . /submissions-api

# Set working directory for future use
WORKDIR /submissions-api

# Install the dependencies from package.json
RUN npm install
ENTRYPOINT npm start
