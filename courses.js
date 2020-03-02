'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {

    readAllPrerequisites: function(course_code, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            let sql1 = `SELECT prereq_code FROM public.prerequisites WHERE course_code='${course_code}' LIMIT 3`;
            client.query(sql1,
                    function(err, result) {
                        console.log('query result ------------>'+ result);
                        if (err) {
                            console.log('Query error: ' + err);
                        } else {
                            let prereqCourses;
                            if (result.rows.length === 0) {
                                console.log('NO PREREQS')
                                //prereqCourses = [];
                            } else {
                                console.log('SOME PREREQS')
                                //for (let i = 0; i < result.rows.length; i++) {
                                //    prereqCourses.push(result.rows[i].prereq_code);
                                //}
                            }
                            //callback(prereqCourses);
                        };
                    });
        });
        pool.end();
    }   

}
