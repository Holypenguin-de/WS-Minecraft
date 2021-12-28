import puppeteer from 'puppeteer';
import path from 'path';
import download from 'download';

const downloadPath = path.resolve('../child');

export async function simplefileDownload(version, type) {
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    // function to load the page
    async function goToPage(url){
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
    let url
    switch(type){
      case "Spigot":
        url = '' + version;
        await goToPage(url);

        break;
      case "Forge":
        url = "https://files.minecraftforge.net/net/minecraftforge/forge/index_" + version + ".html";
        await goToPage(url);
        await page.click('body');
        const frame = page.frames()[3];
        await frame.click('button[title="Accept"]');
        let href = await getHref(await page.$$('a[title="Installer"]'))
        url = href[0].slice(href[0].lastIndexOf('=') + 1);
        download(url, downloadPath);

        break;
      default:
        url = 'https://mcversions.net/download/' + version;
        await goToPage(url);

        url = await getHref(await page.$x("//a[contains(., 'Download Server Jar')]"));
        download((url[0] as string), downloadPath);
        break;
    }

    browser.close();
}

simplefileDownload("1.17.1", "Forge")
