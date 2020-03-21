'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;


module.exports = {

    newOrRegularUser: function(callback, userId){
    
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
                        client.query(`SELECT first_name FROM users WHERE facebook_id='${userId}' LIMIT 1`,
                            function(err, result) {
                                if (err) {
                                    console.log('Query error: ' + err);
                                } else {
                                    console.log("FIRST RESULT = "+result);
                                    console.log(result.rows.length);
                                    console.log(result.rows[0].first_name)
                                    if (result.rows.length === 0) { //first time user
                                        callback("new");
                                    }else{ //regular user
                                        callback("old");
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


}

