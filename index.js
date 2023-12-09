const { Storage } = require("@google-cloud/storage");
const moment = require("moment");
const fs = require("fs");

const storage = new Storage({
  projectId: "off-net-dev",
  credentials: require("C:/Users/lendly.cagata.LTPHDISTIDLCAGA/Desktop/Dora/dora-sa"),
});
const currentDate = moment().format("YYYY-MM-DD_HH-mm-ss");
const bucketName = "github-flow";
const folderName = "webhook-event/test";
const baseFile = `webhook-event/test/event_1_${currentDate}`;

getTargetFile = async (baseFiles) => {
  let maxNumber = -Infinity;
  let targetFile = null;

  baseFiles.forEach((str) => {
    const [_, __, segment] = str.split("_");

    if (segment) {
      const numbers = segment.match(/\d+/g);

      if (numbers) {
        const maxInString = Math.max(...numbers.map(Number));

        if (maxInString > maxNumber) {
          maxNumber = maxInString;
          targetFile = str;
        }
      }
    }
  });

  return targetFile;
};

checkBatchFile = async () => {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: folderName,
    });
    const baseFiles = files.map((file) => file.metadata.name);
    const targetExists = await getTargetFile(baseFiles);
    console.log("Does target exist? ", targetExists);

    const targetExists_download = storage.bucket(bucketName).file(targetExists);

    const [record] = await targetExists_download.download();
    const recordData = JSON.parse(record.toString());
    console.log("Count exist object", recordData.length);

    if (
      !targetExists ||
      targetExists === null ||
      (targetExists === undefined && recordData.length >= 200)
    ) {
      console.log("CREATE A NEW BASE FILE");
      await baseFile.save(JSON.stringify([]));
      console.log("CREATE A NEW BASE FILE");
      return { file: baseFile, status: "success" };
    } else {
      console.log("BASE FILE STILL EXIST");
      return { file: targetExists, status: "success" };
    }
  } catch (error) {
    return error;
  }
};

uploadToGCS = async (payload) => {
  const checkBucket = await checkBatchFile();
  console.log("checkBucket status ", checkBucket.status);
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

exports.default = { checkBatchFile, getTargetFile };

uploadToGCS(fs.readFileSync("deployment_status.json", "utf-8"));
