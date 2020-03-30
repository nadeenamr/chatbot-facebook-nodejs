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

    getFinalDate: function(course_code){
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }else{
                client.query(
                    'SELECT final_date FROM public.finals WHERE course_code=$1', [course_code], // assuming the last final is never a language course
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            return 'CANNOT FIND COURSE WITH THIS CODE '+course_code;
                        } else {
                            return result.rows[0].final_date;
                        };
                    });
                
            }
             
        });
        pool.end();
    },

    getCourseName: function(course_code) {
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
                            return 'CANNOT FIND COURSE WITH THIS CODE '+course_code;
                        } else {
                            return result.rows[0].course_name;
                        };
                    });
        });
        pool.end();
    }

}
