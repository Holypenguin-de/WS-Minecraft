FROM node:17-alpine as build
MAINTAINER Holypenguin

WORKDIR /app
COPY . .

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
       dumb-init \
       chromium\
       openjdk8-jre \
       openjdk16-jre-headless \
       openjdk17-jre-headless \
    # Cleanup
    && apk del --no-cache make gcc g++ binutils-gold gnupg libstdc++ \
    && rm -rf /usr/include \
    && rm -rf /var/cache/apk/* /root/.node-gyp /usr/share/man /tmp/* \
    && npm install -g ts-node \
    && npm install

EXPOSE 8080
EXPOSE 8443
EXPOSE 25565

ENV BROWSER_PATH=/usr/bin/chromium-browser
ENV MC_VERSION=1.18.1
ENV MC_TYPE=Vanilla

ENTRYPOINT ["/usr/bin/dumb-init"]
CMD ["npm", "run", "start"]
