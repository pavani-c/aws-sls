'use strict';

module.exports.handler = function(event, context, cb) {
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};