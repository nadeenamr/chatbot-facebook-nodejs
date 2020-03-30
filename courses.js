'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;


module.exports = {

    readAllCSSemesterCourses: function(callback, semester) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    `SELECT course_code FROM public.courses WHERE (course_semester_cs=$1 AND course_major='CS') OR (course_semester_cs=$1 AND course_major='both')`,
                    [semester],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
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
    },

    readAllDMETSemesterCourses: function(callback, semester) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    `SELECT course_code FROM public.courses WHERE (course_semester_dmet=$1 AND course_major='DMET') OR (course_semester_dmet=$1 AND course_major='both')`,
                    [semester],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
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
    },

    readCoursePrereqs: function(callback, course_code) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'SELECT prereq_code FROM public.prerequisites WHERE course_code=$1',
                    [course_code],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {
                            let codes = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                codes.push(result.rows[i].prereq_code);
                            }
                            callback(codes);
                        };
                    });
        });
        pool.end();
    },

    getLastFinal: function(callback, courses){
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }else{
                let allCourses = courses.toUpperCase().split(", ");
                let currentMaxDateCourseCode = allCourses[0]; // if have more than 1 final in 1 day
                let currentMaxDate;
                console.log("COURSES ---> "+allCourses);
                console.log("TYPE OF COURSES ---> "+ typeof allCourses);
                for(let i=0; i<allCourses.length; i++){
                    console.log(allCourses[i]);
                    let sql =`SELECT final_date FROM public.finals WHERE course_code='${allCourses[i]}'`;
                    console.log("SQL ---> "+sql);
                    client.query(sql,
                        function(err, result) {
                            if (err) {
                                console.log(err);
                                callback('CANNOT FIND FINAL DATE FOR THIS COURSE '+allCourses[i]);
                            } else {
                                if(i==0){
                                    currentMaxDate = result.rows[0].final_date;
                                }else{
                                    if(currentMaxDate<result.rows[i].final_date){
                                        currentMaxDate = result.rows[i].final_date;
                                        currentMaxDateCourseCode = allCourses[i];
                                    }
                                }
                                console.log("FINAL DATE OF "+allCourses[i]+" is "+result.rows[0].final_date);
                            }
                            
                        }
                    );
                }
                console.log("COURSE OF MAX DATE --> "+currentMaxDate);
                callback([currentMaxDate,currentMaxDateCourseCode]);

            }
             
        });
        pool.end();
    },

    getCourseName: function(callback, course_code) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client.query(
                    'SELECT course_name FROM public.courses WHERE course_code=$1', [course_code], // assuming the last final is never a language course
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('CANNOT FIND COURSE WITH THIS CODE '+course_code);
                        } else {
                            callback(result.rows[0].course_name);
                        };
                    });
        });
        pool.end();
    }

}
