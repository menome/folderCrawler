# note that order matters in terms of docker build layers. Least changed near start to most changed...
# This image will be based on the official nodejs docker image
FROM node:8.4.0

EXPOSE 80
ENV PORT 80

# Install stuff for samba mounting
RUN apt-get update && apt-get install -y cifs-utils

# Commands will run in this directory
RUN mkdir /srv/app
WORKDIR /srv/app

# Add build file
COPY ./package.json package.json

# Handle NPM Token Management
ARG NPM_TOKEN
COPY .npmrc-deploy .npmrc

# Install dependencies and generate production dist
RUN npm install
RUN rm -f .npmrc

# Copy the code for the prod container.
# This seems to not cause any problems in dev when we mount a volume at this point.
COPY ./app app
COPY ./config config

CMD ["npm", "start"]