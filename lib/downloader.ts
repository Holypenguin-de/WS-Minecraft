import {mkdirSync, existsSync, writeFileSync} from 'fs';
import {resolve} from 'path';
import fetch from "node-fetch";
import download from 'download';

export async function simplefileDownload(dir: string, type: string, version: string){
   const downloadPath = resolve(dir);

   // Creating child directory
   if(!existsSync(downloadPath)){
      mkdirSync(dir);
   }

   // selecting Type
   let url: string;
   let mc_json = [];
   switch(type){
      case "Spigot":
         url="https://hub.spigotmc.org/jenkins/job/BuildTools/lastStableBuild/artifact/target/BuildTools.jar";
         break;
      case "Forge":
	 // Get Forge-Download URL
	 await fetch ("https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json", { method: "get" })
         .then(res => res.json())
	 .then(data => mc_json = data);
	 if(mc_json["promos"][version + "-recommended"] !== undefined){
	    mc_json = mc_json["promos"][version + "-recommended"];
	 }else{
	    mc_json = mc_json["promos"][version + "-latest"]; 
	 }
	 url = "https://maven.minecraftforge.net/net/minecraftforge/forge/" + version + "-" + mc_json + "/forge-" + version + "-" + mc_json + "-installer.jar"; 
	 break;
      default:
	 // Get Vanilla-Download URL
         await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json", { method: "get" })
	 .then(res => res.json())
	 .then(data => mc_json = data);
	 mc_json = mc_json["versions"].find((x: any)  => x.id === version);
         await fetch(mc_json["url"], { method: "get" })
	 .then(res => res.json())
	 .then(data => mc_json = data);
	 url = mc_json["downloads"]["server"]["url"];
	 break;
   }
  await download(url, downloadPath);    
  return true;
}
