import { WebSocketServer } from 'ws';
import { readFileSync, appendFile, writeFile, closeSync, openSync, existsSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import { Tail } from 'tail';
import { simplefileDownload } from './lib/downloader';
import { sleep } from './lib/sleep';
import { changeJavaVersion } from "./lib/changeJavaVersion";
import { website } from "./lib/website";
import {build} from "./lib/builder";
import { createServer as createhttps } from 'https';
import { createServer as createhttp } from 'http';
import { verify } from 'jsonwebtoken';

async function main() {

  // minecraft vars
  const type = process.env.MC_TYPE;
  const version = process.env.MC_VERSION;

  // check gui
  const gui = process.env.BUILDIN_WEB_GUI;

  // file vars
  const dir = "./child"
  const file = dir + "/input.txt";

  // server vars
  let server: any;
  let port: number;

  // create var to check if https is enabled or not
  let https: boolean;

  // var to check if server get error and / or resolve the problem on its own
  let error = false;

  // create logwatcher
  const tail = new Tail(file);

  if (existsSync("./certs/cert.pem") && existsSync('./certs/key.pem')) {
    https = true;

    // create server with https for websocket
    server = createhttps({
      cert: readFileSync("./certs/cert.pem"),
      key: readFileSync("./certs/key.pem"),
    });
    port = 8443;
  } else {
    https = false;

    // create server with http for websocket
    console.log("Server is now using HTTP, if you want to use HTTPS, then add 'cert.pem' and 'key.pem' in the folder '/app/certs' and restart the container!");
    server = createhttp();
    port = 8080;
  }

  // create websocket
  const wss = new WebSocketServer({ server });

  // changing to the right java-version for the Minecraft Version
  changeJavaVersion(version);

  // Prepare if not already happened
  if (!existsSync(dir)) {
    const download_var = await simplefileDownload(dir, type, version);
    if (!download_var) {
      console.log("Something went wrong while downloading!");
      process.exit();
    }
  } else {
    console.log("Server already downloaded")
  }

  if(!existsSync(dir + "eula.txt") || !existsSync(dir + "server.jar")){
    const build_var = build(dir, type, version);
    if (!build_var) {
      console.log("Something went wrong while downloading!");
      process.exit();
    }
  } else {
      console.log("Server already prepared!");
  }

  // clear file
  closeSync(openSync(file, 'w'));

  // client authentication
  if (process.env.JWT) {
    server.on('upgrade', (request: any, socket: any) => {
      const jwttokken = request.headers.jwt;
      try {
        verify(jwttokken, process.env.JWT_SECURE_STRING);
      } catch (e) {
        console.log("Unauthorized client tried to connect!");
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.end();
        return;
      }
    });
  }

  // starting gui if enabled
  if (gui) {
    website();
  }

  // start minecraft server
  console.log("Sarting Minecraft-Server...");
  const mc_server = spawn('java', ['-jar', 'server.jar', 'nogui'], { cwd: "./child" });

  tail.on(("line"), function(line) {
    if (line.match(/.*FATAL.*/g) || (line.match(/.*ERROR.*/g) && line.match(/.*JMX.*/g) === null) || line.match(/.*Server Shutdown.*/)) {
      killOnError();
    } else {
      error = true;
    }
  });

  async function killOnError() {
    await sleep(10000)
    if (!error) {
      console.log("\nWaiting 10sec if something is happening!");
      await sleep(10000);
      if (!error) {
        console.log("Stopping server and removing comman errors!");
        mc_server.kill();
        // remove comman errors and kill node, docker will restart it
        spawnSync('rm', ['-f', 'world/session.lock'], { cwd: "./child" });
        spawnSync('killall', ['java']);
        process.exit();
      }
    }
  }

  // clear logfile
  writeFile(file, "", (err) => {
    if (err) throw err;
  });

  // function on error
  mc_server.stderr.on('data', (data) => {
    let text = data.toString();
    console.log(text);
    appendFile(file, text, (err) => {
      if (err) throw err;
    });
  });

  // function on stdout
  mc_server.stdout.on('data', (data) => {
    let text = data.toString();
    console.log(text);
    appendFile(file, text, (err) => {
      if (err) throw err;
    });
  });

  console.log("Starting WebSocket...");

  // start websocket
  wss.on('connection', function connection(ws) {

    // happened on incomming message
    ws.on('message', function message(data) {
      let text = data.toString();
      // write text to file
      appendFile(file, ">> " + text + "\n", (err) => {
        if (err) throw err;
      });

      // send text to childproccess
      mc_server.stdin.write(text + "\n");
    });

    // send new lines to websocket
    tail.on(("line"), function(line) {
      ws.send((line));
    });

    // send file on first connection
    ws.send(readFileSync(file, { encoding: 'utf8', flag: 'r' }));
  });
  // start loglistener
  tail.watch();

  // starte server
  server.listen(port);
  if (https) {
    console.log("WebSocket is listening on: https://0.0.0.0:" + port + "/");
  } else {
    console.log("WebSocket is listening on: http://0.0.0.0:" + port + "/");
  }

}
main();
