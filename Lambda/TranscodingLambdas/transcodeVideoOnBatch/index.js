/*jshint loopfunc: true */
console.log('transcode video');

var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
var dynamodb = new AWS.DynamoDB.DocumentClient();
var batch = new AWS.Batch();

exports.handler = function(event, context) {
    "use strict";

    for(var i = 0; i < event.Records.length; i++) {

        let record = event.Records[i];

        let videoId = record.Sns.Message;

        dynamodb.get({
            TableName: "Videos",
            Key:{
                "Id": videoId
            },
            AttributesToGet: [
                'Files',
            ]
        }, function(err, data) {
            if (err) {
                console.log(err);
                return context.fail(err);
            }
            else {
                let key = data.Item.Files.Original.Key;


                var params = {
                    jobDefinition: process.env.jobDefinition, /* required */
                    jobName: process.env.jobName, /* required */
                    jobQueue: process.env.jobQueue, /* required */
                    containerOverrides: {
                        environment: [
                            {
                                name: 'INPUT_FILE',
                                value: key
                            },
                            {
                                name: 'OUTPUT_FILE',
                                value: data.Item.Files.Original.Key
                            }
                        ]
                    }
                };

                batch.submitJob(params, function(err, data) {
                    if (err) {
                        console.error(err, err.stack);
                        context.fail();
                        return;
                    }
                    else {
                        console.log(data);
                        context.succeed();
                    }
                });

            }
        });
    }
};
