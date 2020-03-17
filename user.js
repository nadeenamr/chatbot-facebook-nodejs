'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;

module.exports = function(callback, userId){

    var user = JSON.parse(body);
    if(user.first_name){
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            var rows = [];
            console.log('fetching user');
            client.query(`SELECT facebook_id FROM users WHERE facebook_id='${userId}' LIMIT 1`,
                function(err, result) {
                    console.log('query result ' + result);
                    if (err) {
                        console.log('Query error: ' + err);
                    } else {
                        console.log('rows: ' + result.rows.length);
                        if (result.rows.length === 0) {
                            let sql = 'INSERT INTO users (facebook_id, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7)';
                            console.log('sql: ' + sql);
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
    }else{
        console.log("Cannot get data for fb user with id "+userId);
    }
    

}