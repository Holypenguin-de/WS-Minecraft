import puppeteer from 'puppeteer';
import {resolve} from 'path';
import download from 'download';
import { spawnSync } from 'child_process';
import { unlinkSync, rename, writeFileSync, readdirSync } from 'fs';

export async function simplefileDownload(type: string, version: string) {
    const downloadPath = resolve('./child');

    const eula = true;

    if(eula){
      console.log("Downloading Minecrat-Server...");
      writeFileSync(downloadPath + "/eula.txt", "eula=true");
    }else{
      console.log("Please accept the EULA!");
      process.exit();
    }

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    // function to load the page
    async function goToPage(url: string){
      await page.goto(
          url,
          { waitUntil: 'networkidle2' }
      );

      await (page as any)._client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadPath
      });
    }

    // download function
    async function getHref(elementHandles){
      const propertyJsHandles = await Promise.all(
        elementHandles.map(handle => handle.getProperty('href'))
      );
      const href:object = await Promise.all(
        propertyJsHandles.map(handle => handle.jsonValue())
      );
      return href;
    }

    // create url
    let url: string|object
    switch(type){
      case "Spigot":
        url = 'https://hub.spigotmc.org/jenkins/job/BuildTools/lastStableBuild/artifact/target/BuildTools.jar';
        await download(url, downloadPath);
        console.log("Building Spigot...");
        spawnSync("java", ["-jar", downloadPath + "/BuildTools.jar", "--compile", "SPIGOT", "--rev", version], {cwd: downloadPath, shell: "/bin/bash"});
        unlinkSync(downloadPath + "/BuildTools.jar");
        rename(downloadPath + "/spigot-" + version + ".jar", downloadPath + "/server.jar", ()=>{});
        break;
      case "Forge":
        let unSupportet = ["1.17", "1.17.1", "1.18", "1.18.1"];
        if(!unSupportet.includes(version)){
          url = "https://files.minecraftforge.net/net/minecraftforge/forge/index_" + version + ".html";
          await goToPage(url);
          await page.click('body');
          const frame = page.frames()[3];
          await frame.click('button[title="Accept"]');
          let href = await getHref(await page.$$('a[title="Installer"]'))
          url = href[0].slice(href[0].lastIndexOf('=') + 1);
          await download(url, downloadPath);
          console.log("Building Forge...");
          spawnSync("java", ["-jar", downloadPath + "/forge-*-installer.jar", "--installServer"], {cwd: downloadPath, shell: "/bin/bash"});
          //rename(downloadPath + "/minecraft_server." + version + ".jar", downloadPath + "/server.jar", ()=>{});
          const files = readdirSync(downloadPath);
          files.forEach((file)=>{
            if(file.match(/forge-.*installer\.jar/)){
              unlinkSync(downloadPath + "/" + file);
            }else if(file.match(/forge-.*\.jar/)){
              rename(downloadPath + "/" + file, downloadPath + "/server.jar", ()=>{});
            }
          });

        }else{
          console.log("This Forge version is not supportet yet!");
          console.log("Unsupportet Forge versions are: " + unSupportet);
          return 0;
        }
        break;
      default:
        url = 'https://mcversions.net/download/' + version;
        await goToPage(url);
        url = await getHref(await page.$x("//a[contains(., 'Download Server Jar')]"));
        await download((url[0] as string), downloadPath);
        break;
    }

    browser.close();
    return 1;
}
