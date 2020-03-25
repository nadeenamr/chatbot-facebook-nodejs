'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
const prolog = require('./prolog');
pg.defaults.ssl = true;


module.exports = {

    newOrRegularStudent: function(callback, userId){
    
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

    saveStudentID: function(studentID, userId) {
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

    saveStudentUsername: function(studentUsername, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }

            let sql1 = `SELECT student_id FROM students WHERE facebook_id='${userId}' LIMIT 1`;
            client.query(sql1,
                    function(err, result) {
                        if (err) {
                            console.log('Query error: ' + err);
                        } else {
                            let sql;
                            if (result.rows.length === 0) {
                                sql = `INSERT INTO students (student_username) VALUES ($1) WHERE facebook_id=$2`;
                            } else {
                                sql = `UPDATE students SET student_username=$1 WHERE facebook_id=$2`;
                            }
                            client.query(sql, [studentUsername,userId]);
                        }
                    }
                    );
        });
        pool.end();
    },

    getStudentTranscript: function(callback, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            let sql = `SELECT student_id FROM students WHERE facebook_id='${userId}'`;
            client.query(sql,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('ERROR FINDING STUDENT ID IN STUDENT INFO TABLE');
                        } else {
                            let studentID = result.rows[0].student_id;
                            console.log(studentID);
                            let sql1 = `SELECT student_firstname,student_major,student_semester,student_gpa FROM student_info WHERE student_id='${studentID}'`;
                            client.query(sql1,
                                function(err, result) {
                                    if (err) {
                                        console.log(err);
                                        callback('ERROR WITH STUDENT INFO');
                                    } else {
                                        if(result==undefined){
                                            callback("Student Info is undefined.");
                                        }else{
                                            console.log("RESUUULLLTTTTT ---> "+result.rows[0]);
                                            let studentInfo = "student("+studentID+","+result.rows[0].student_firstname+","+result.rows[0].student_major+","+result.rows[0].student_semester+","+result.rows[0].student_gpa+").";                                     
                                            let sql2 = `SELECT student_id,course_id,grade FROM taken_courses WHERE student_id='${studentID}'`;
                                            client.query(sql2,
                                                    function(err, result) {
                                                        if (err) {
                                                            console.log(err);
                                                            callback('ERROR WITH STUDENT HISTORY');
                                                        } else {
                                                            if(""+result=="undefined"){
                                                                callback("Student Info is undefined.");
                                                            }else{
                                                                let history = [];
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    if(result.rows[i].grade=="Abs"){
                                                                        history.push("failed_course("+result.rows[i].student_id+","+result.rows[i].course_id+",a).");
                                                                    }else{
                                                                        if(result.rows[i].grade=="FA" || result.rows[i].grade=="Ff"){
                                                                            history.push("failed_course("+result.rows[i].student_id+","+result.rows[i].course_id+",o).");
                                                                        }else{
                                                                            history.push("passed_course("+result.rows[i].student_id+","+result.rows[i].course_id+").");
                                                                        }
                                                                    }
                                                                }
                                                                let studentHistory = history.join("\n");
                                                                let transcript = studentInfo+"\n"+studentHistory;
                                                                callback([studentID,transcript.toLowerCase()]);
                                                            }
                                                            
                                                        };
                                                });

                                        }
                                        
                                    };
                                }
                        );

                    };
                }
            );
        });
        pool.end();
    }

}

