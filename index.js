const { Storage } = require("@google-cloud/storage");
const moment = require("moment");
const fs = require("fs");

const storage = new Storage({
  projectId: "off-net-dev",
  credentials: require("C:/Users/lendly.cagata.LTPHDISTIDLCAGA/Desktop/Dora/dora-sa"),
});

async function checkBatchFile() {
  const storage = new Storage({
    projectId: "off-net-dev",
    credentials: require("C:/Users/lendly.cagata.LTPHDISTIDLCAGA/Desktop/Dora/dora-sa"),
  });

  try {
    const bucket = storage.bucket(`github-flow`);
    let baseFile = bucket.file(`webhook-event/github/test.json`);
    const [baseFileExists] = await baseFile.exists();
    if (!baseFileExists) {
      await baseFile.save(JSON.stringify([]));
      console.log("CREATE A NEW BASE FILE");
      return "good";
    } else {
      console.log("BASE FILE STILL EXIST");
      return "good";
    }
  } catch (error) {
    return error;
  }
}

async function uploadToGCS(payload) {
  const checkBucket = await checkBatchFile();
  if (checkBucket == "good") {
    try {
      const getBaseFile = storage
        .bucket("github-flow")
        .file(`webhook-event/github/test.json`);

      const [file] = await getBaseFile.download();
      const existingData = JSON.parse(file.toString());
      console.log("Count exist object", existingData.length);
      existingData.push(JSON.parse(payload));
      console.log("Count additional object", existingData.length);

      await storage
        .bucket("github-flow")
        .file("webhook-event/github/test.json")
        .save(JSON.stringify(existingData));
    } catch (error) {
      console.error("Error uploading JSON data to GCS:", error);
    }
  }
}

uploadToGCS(fs.readFileSync("deployment_status.json", "utf-8"));
