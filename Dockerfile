FROM node:17-alpine
MAINTAINER Holypenguin

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    dumb-init \
    udev \
    chromium\
    openjdk8-jre \
    openjdk16-jre-headless \
    openjdk17-jre-headless \
    # Cleanup
    && apk del --no-cache make gcc g++ binutils-gold gnupg libstdc++ \
    && rm -rf /usr/include \
    && rm -rf /var/cache/apk/* /root/.node-gyp /usr/share/man /tmp/* \
    && echo \
    && npm install -g ts-node

EXPOSE 8080
EXPOSE 25565

WORKDIR /app
COPY . .

ENV BROWSER_PATH=/usr/bin/chromium-browser
ENV MC_VERSION=1.18.1
ENV MC_TYPE=Vanilla

RUN npm install
RUN chmod -R o+rwx node_modules/puppeteer/.local-chromium

ENTRYPOINT ["/usr/bin/dumb-init"]
CMD ["npm", "run", "start"]
