const { Storage } = require("@google-cloud/storage");
const moment = require("moment");
const fs = require("fs");

const storage = new Storage({
  projectId: "off-net-dev",
  credentials: require("C:/Users/lendly.cagata.LTPHDISTIDLCAGA/Desktop/Dora/dora-sa"),
});
const currentDate = moment().format("YYYY-MM-DD_HH-mm-ss");
const bucketName = "github-flow";
const folderName = "webhook-event/github";
const baseEvent = `webhook-event/github/event_1_${currentDate}`;

getTargetFile = async (baseFiles) => {
  let max = 0;
  let target = "";
  for (const i of baseFiles) {
    const chars = i.split("");
    if (chars[27]) {
      const result = parseInt(chars[27]);
      if (result > max) {
        target = i;
      }
    }
  }
  return target;
};

function createNewTargetFile(input) {
  const chars = input.split("");
  const result = parseInt(chars[27]) + 1;
  return result;
}

checkBatchFile = async () => {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: folderName,
    });
    const baseFiles = files.map((file) => file.metadata.name);
    console.log("Array of base files ", baseFiles);
    const targetExists = await getTargetFile(baseFiles);
    console.log("Does target exist? ", targetExists);

    if (!targetExists) {
      console.log("CREATE A NEW BASE FILE");
      await storage.bucket(bucketName).file(baseEvent).save(JSON.stringify([]));
      console.log("CREATE A NEW BASE FILE");
      return { file: baseEvent, status: "success" };
    } else {
      const targetExists_download = storage
        .bucket(bucketName)
        .file(targetExists);

      const [record] = await targetExists_download.download();
      const recordData = JSON.parse(record.toString());
      console.log("Count exist object", recordData.length);
      if (recordData.length === 4) {
        console.log("CREATE A NEW BASE FILE");
        const newTargetNumber = await createNewTargetFile(targetExists);
        console.log("New Target number is : ", newTargetNumber);
        const newTargetFile = `webhook-event/github/event_${newTargetNumber}_${currentDate}`;
        await storage
          .bucket(bucketName)
          .file(newTargetFile)
          .save(JSON.stringify([]));
        console.log("CREATE A NEW BASE FILE");
        return { file: newTargetFile, status: "success" };
      } else {
        console.log("BASE FILE STILL EXIST");
        return { file: targetExists, status: "success" };
      }
    }
  } catch (error) {
    return error;
  }
};

uploadToGCS = async (payload) => {
  const checkBucket = await checkBatchFile();
  console.log("checkBucket status ", checkBucket);
  if (checkBucket.status == "success") {
    try {
      const getBaseFile = storage.bucket(bucketName).file(checkBucket.file);

      const [file] = await getBaseFile.download();
      const existingData = JSON.parse(file.toString());
      console.log("Count exist object", existingData.length);
      existingData.push(JSON.parse(payload));
      console.log("Count additional object", existingData.length);

      await storage
        .bucket(bucketName)
        .file(checkBucket.file)
        .save(JSON.stringify(existingData));
    } catch (error) {
      console.error("Error uploading JSON data to GCS:", error);
    }
  }
};

exports.default = { checkBatchFile, getTargetFile, createNewTargetFile };

uploadToGCS(fs.readFileSync("deployment_status.json", "utf-8"));
