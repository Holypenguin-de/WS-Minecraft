import {spawnSync} from 'child_process';
import {unlinkSync, rename, writeFileSync} from 'fs';


export function build(dir: string, type: string, version: string){
	// Check if eula is acceptet and accept it
	const eula = process.env.EULA;
	if(eula){
		console.log("Accepting eula...");
		writeFileSync(dir + "eula.txt", "eula=true");
	}else{
		console.log("Please accept the EULA!");
		process.exit();
	}

	// Check wich mc-server type and prepare it
	switch(type){
		case "Spigot":
			spigotBuilder(dir, version);
			break;
		case "Forge":
			forgeBuilder(dir);
			break;
		default:
			vanillaBuilder(dir);
			break;
	}
	return true;
}

function spigotBuilder(dir: string, version:string){
	console.log("Preparing Spigot...");
	spawnSync("java", ["-jar", dir + "/BuildTools.jar", "--compile", "SPIGOT", "--rev", version], { cwd: dir, shell: "/bin/bash", maxBuffer: 1024 * 1024 * 2 });
	unlinkSync(dir + "BuildTools.jar");
	rename(dir + "/spigot-" + version + ".jar", dir + "/server.jar", () => {});
}

function forgeBuilder(dir: string){

}

function vanillaBuilder(dir: string){

}
