/*jshint loopfunc: true */
console.log('alpr video');

var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
var dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    useAccelerateEndpoint: true
});
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

                console.log('Getting video url from Bucket [' + data.Item.Files.Original.Bucket + '] Key [' + data.Item.Files.Original.Key + ']');
                var input_file = s3.getSignedUrl('getObject', {
                    Bucket: data.Item.Files.Original.Bucket,
                    Key: data.Item.Files.Original.Key,
                    Expires: 3600
                });

                var params = {
                    jobDefinition: process.env.jobDefinition, /* required */
                    jobName: process.env.jobName, /* required */
                    jobQueue: process.env.jobQueue, /* required */
                    containerOverrides: {
                        environment: [
                            {
                                name: 'INPUT_FILE',
                                value: input_file
                            },
                            {
                                name: 'VIDEO_ID',
                                value: videoId
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
