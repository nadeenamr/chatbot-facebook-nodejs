'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;


module.exports = {

    readAllCourses: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client.query(
                    `SELECT course_code FROM public.courses`,
                    function(err, result) {
                        console.log('query result '+ result);
                        if (err) {
                            console.log(err);
                            callback([]);
                        } else {
                            let codes = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                codes.push(result.rows[i].course_code);
                            }
                            callback(codes);
                        };
                    });
        });
        pool.end();
    }

}

