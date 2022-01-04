
export function changeJavaVersion(version: any) {
  // MC-Verson < 1.17 = Java-Version 8
  // MC-Version < 1.18 = Java-Version 16
  // MC-Version >= 1.18 = Java-Version 17
  const versionNum = version.slice(2, version.lastIndexOf("."));

  if (versionNum < 17) {
    process.env.JAVA_PATH = "/usr/lib/jvm/java-8-openjdk/bin/java"
  } else if (versionNum < 18) {
    process.env.JAVA_PATH = "/usr/lib/jvm/java-16-openjdk/bin/java"
  } else if (versionNum >= 18) {
    process.env.JAVA_PATH = "/usr/lib/jvm/java-17-openjdk/bin/java"
  }
}
