/*jshint loopfunc: true */
console.log('video transcoded');

var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
var dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = function(event, context) {
    "use strict";

    console.log("Event: " + JSON.stringify(event));

    for(var i = 0; i < event.Records.length; i++) {

        var record = event.Records[i];

        var bucket = record.s3.bucket.name;
        var key = record.s3.object.key;

        let keyParts = key.split('/');

        //Extract the parts from the key
        var videoId = keyParts[2].split('.')[0];

        dynamodb.update({
            TableName: "Videos",
            Key:{
                "Id": videoId
            },
            UpdateExpression: "set Files.Web = :transcoded",
            ExpressionAttributeValues:{
                ":transcoded":{
                    "Bucket": bucket,
                    "Key": key
                },
            },
            ReturnValues:"UPDATED_NEW"
        }, function(err, data) {
            if (err) {
                console.error('Unable to update video with transcoded key for videoId [' + videoId + ']. Error JSON:', JSON.stringify(err, null, 2));
                context.fail();
            } else {
                console.log("Video transcoded location updated succeeded:", JSON.stringify(data, null, 2));

                if (i == event.Records.length - 1) {
                    context.succeed();
                }
            }
        });
    }
};
