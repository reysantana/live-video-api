const cluster = require('cluster');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const mysql = require('mysql');

if(cluster.isMaster) {
    cluster.fork();
    cluster.on('exit', function (_worker, _code, _signal) {
        cluster.fork();
    });
}

if(cluster.isWorker) {
    var app = express();
    var server = http.createServer(app);

    const pool = mysql.createPool({
        host: "localhost",
        user: "root",
        password: "",
        database: "livetv-app"
    });

    app.set('port', process.env.PORT || 3001);
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.get('/getVideos', function(req, res) {
        const bodyData = req.query;
        
        pool.getConnection(function(err, connection) {
            console.log(bodyData.country_id);
            if (err || bodyData.country_id === undefined || bodyData.country_id == "") {
                console.log("Error: " + err);
                res.status(400).send(false);
            } else {
                var sql = "SELECT videoId, videoTitle from regionchannel WHERE country_id = " + bodyData.country_id + ";";
                connection.query(sql, async function (error, results, fields) {
                    connection.release();
                    if(error) {
                        console.log(error + "\n");
                        res.status(400).send(false);
                    } else {
                        console.log("Found " + results.length + " entries.");
                        res.status(200).send(results);
                    }
                });
            }
        });
    });

    server.listen(app.get('port'), function () {
        console.log("Live TV API Server is running at Port " + app.get('port') + "\n");
    });
}