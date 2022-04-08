'use strict';

async function uploadUrl(event, context, cb) {
    logger.info("Event: ", JSON.stringify(event, "", 2));
    logger.info("Context: ", JSON.stringify(context, "", 2));
    let type;
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
async function getUrl(event, context, cb) {
    logger.info("Event: ", JSON.stringify(event, "", 2));
    logger.info("Context: ", JSON.stringify(context, "", 2));
    let url;
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

module.exports = {
    uploadUrl,
    getUrl
}