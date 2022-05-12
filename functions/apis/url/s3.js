'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const csv = require('@fast-csv');

async function uploadUrl(event, context, cb) {
    console.log("Request received");

   /* // Extract file content
    let fileContent = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;

    // Generate file name from current timestamp
    let fileName = `${Date.now()}`;

    // Determine file extension
    let contentType = event.headers['content-type'] || event.headers['Content-Type'];
    let extension = 'csv';//contentType ? mime.extension(contentType) : '';

    let fullFileName = extension ? `${fileName}.${extension}` : fileName;

    // Upload the file to S3
    try {
        let data = await s3.putObject({
            Bucket: "ee-taxcode-files",
            Key: fullFileName,
            Body: fileContent,
            Metadata: {}
        }).promise();

        console.log("Successfully uploaded file", fullFileName);
        return "Successfully uploaded";

    } catch (err) {
        console.log("Failed to upload file", fullFileName, err);
        throw err;
    }*/
};

async function getUrl(event, context, cb) {

       // Get the file from the bucket
        let key = 'SAMPLE TAX LOCATOR FILE.csv';

        const params = {
            Bucket: 'ee-taxcode-files',
            Key: key,
        };

        const csvFile = s3.getObject(params).createReadStream();

        let parserFcn = new Promise((resolve, reject) => {
            const parser = csv
                .parseStream(csvFile, {headers: true})
                .on("data", function (data) {
                    console.log('Data parsed: ', data);
                })
                .on("end", function () {
                    resolve("csv parse process finished");
                })
                .on("error", function () {
                    reject("csv parse process failed");
                });
        });

};

module.exports = {
    uploadUrl,
    getUrl
}