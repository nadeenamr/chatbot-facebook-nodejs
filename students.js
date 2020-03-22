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
                        client.query(`SELECT first_name FROM students WHERE facebook_id='${userId}' LIMIT 1`,
                            function(err, result) {
                                if (err) {
                                    console.log('Query error: ' + err);
                                } else {
                                    console.log("FIRST RESULT = "+user.first_name);
                                    console.log(result.rows.length);
                                    if (result.rows.length === 0) { //first time user
                                        let sql = 'INSERT INTO students (facebook_id, first_name, last_name) VALUES ($1, $2, $3)';
                                        client.query(sql, [ userId, user.first_name, user.last_name ]);
                                        callback(["new",user.first_name]);    
                                    }else{ //regular user
                                        callback(["old",user.first_name]);
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
    },

    takingStudentID: function(studentID, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }

            let sql1 = `SELECT student_id FROM public.students WHERE facebook_id='${userId}' LIMIT 1`;
            client.query(sql1,
                    function(err, result) {
                        if (err) {
                            console.log('Query error: ' + err);
                        } else {
                            let sql;
                            if (result.rows.length === 0) {
                                sql = 'INSERT INTO public.students (student_id) VALUES ($1) WHERE facebook_id=$2';
                            } else {
                                sql = 'UPDATE public.students SET student_id=$1 WHERE facebook_id=$2';
                            }
                            client.query(sql, [studentID,userId]);
                        }
                    }
                    );
        });
        pool.end();
    },

    takingStudentUsername: function(studentUsername, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }

            let sql1 = `SELECT student_id FROM public.students WHERE facebook_id='${userId}' LIMIT 1`;
            client.query(sql1,
                    function(err, result) {
                        if (err) {
                            console.log('Query error: ' + err);
                        } else {
                            let sql;
                            if (result.rows.length === 0) {
                                sql = 'INSERT INTO public.students (student_username) VALUES ($1) WHERE facebook_id=$2';
                            } else {
                                sql = 'UPDATE public.students SET student_username=$1 WHERE facebook_id=$2';
                            }
                            client.query(sql, [studentUsername,userId]);
                        }
                    }
                    );
        });
        pool.end();
    }


}

