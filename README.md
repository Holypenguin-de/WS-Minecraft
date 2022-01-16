# WS-minecraft

## Index
1. [What is this?](#1-what-is-this)
2. [Features](#2-features) <br>
   1. [JWT-Client-Authentication](#21-jwt-client-authentication)
   2. [MC-Server-Downloader](#22-mc-server-downloader)
   3. [Buildin-Web-GUI](#23-buildin-web-gui)
3. [Enviroment Variables](#enviroment-variables)

## 1) What is this?

## 2) Features

### 2.1) JWT-Client-Authentication

### 2.2) MC-Server-Downloader

### 2.3) Buildin-Web-GUI


## Enviroment Variables

|Enviroment|Default|Description|used from|
|-|-|-|-|
|JWT|false|Disable/Enable JWT-Client-Authentication|JWT-Client-Authentication|
|JWT_SECURE_STRING||set the jwt-secure-string (only needed if JWT=true)|JWT-Client-Authentication|
|BROWSER_PATH|should be: /usr/bin/chromium|set the chromium path(not needed inside of the official Docker)|MC-Server-Downloader|
|MC_VERSION|1.18.1|set the Minecraft version|MC-Server-Downloader|
|MC_TYPE|Vanilla|set the server type (Vanilla, Spigot or Forge)|MC-Server-Downloader|
|BUILDIN_WEB_GUI|true|enable the build in webgui|Buildin-Web-GUI|
