'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;


module.exports = function(callback, userId){
    
        //first read user firstname
        request({
            uri: 'https://graph.facebook.com/v2.7/' + userId,
            qs: {
                access_token: config.FB_PAGE_TOKEN
            }
    
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
    
                var user = JSON.parse(body);
                if (user.first_name) {
    
                    var pool = new pg.Pool(config.PG_CONFIG);
                    pool.connect(function(err, client, done) {
                        if (err) {
                            return console.error('Error acquiring client', err.stack);
                        }
                        var rows = [];
                        client.query(`SELECT facebook_id FROM users WHERE facebook_id='${userId}' LIMIT 1`,
                            function(err, result) {
                                if (err) {
                                    console.log('Query error: ' + err);
                                } else {
                                    if (result.rows.length === 0) {
                                        let sql = 'INSERT INTO users (facebook_id, first_name, last_name) VALUES ($1, $2, $3)';
                                        client.query(sql,
                                            [
                                                userId,
                                                user.first_name,
                                                user.last_name
                                            ]);
                                    }
                                }
                            });

                    });
                    pool.end();
    
                } else {
                    console.log("Cannot get data for fb user with id ", userId);
                }
            } else {
                console.error(response.error);
            }
    
        });
    }


