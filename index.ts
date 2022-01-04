import { WebSocketServer } from 'ws';
import { readFileSync, appendFile, writeFile, closeSync, openSync, existsSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import { Tail } from 'tail';
import { simplefileDownload } from './lib/downloader';
import { sleep } from './lib/sleep';
import { changeJavaVersion } from "./lib/changeJavaVersion"

async function main() {

  const type = process.env.MC_TYPE;
  const version = process.env.MC_VERSION;

  changeJavaVersion(version);

  // Prepare if not already happened
  if (!existsSync("./child/server.jar")) {
    const download = await simplefileDownload(type, version);
    if (!download) {
      process.exit();
    }
  } else {
    console.log("Server already downloaded")
  }

  // clear file
  const file = "./child/input.txt";
  closeSync(openSync(file, 'w'));

  // create websocket
  const wss = new WebSocketServer({ port: 8080 });
  // create logwatcher
  const tail = new Tail(file);

  console.log("Sarting Minecraft-Server...");

  // start minecraft server
  const mc_server = spawn('java', ['-jar', 'server.jar', 'nogui'], { cwd: "./child" });

  let error = false;
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

  // start loglistener
  tail.watch();

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

  console.log("WebSocket is running on: http://localhost:8080/");
}

main();
