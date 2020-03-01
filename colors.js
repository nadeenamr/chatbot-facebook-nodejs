'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {

    readAllColors: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client.query(
                    `SELECT color FROM public."iphone_colors"`,
                    function(err, result) {
                        console.log('query result '+ result);
                        if (err) {
                            console.log(err);
                            callback([]);
                        } else {
                            let colors = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                colors.push(result.rows[i].color);
                            }
                            callback(colors);
                        };
                    });
            done();
        });
        pool.end();
    }

}
