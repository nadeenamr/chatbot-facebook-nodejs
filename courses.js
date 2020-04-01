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

    getFinalDate: function(callback, course_code){
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
                            callback('CANNOT FIND COURSE WITH THIS CODE '+course_code);
                        } else {
                            callback(result.rows[0].final_date.getDate()+"/"+(1+parseInt(result.rows[0].final_date.getMonth()))+"/"+result.rows[0].final_date.getFullYear());
                        };
                    });
                
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
                            console.log("RESULT -- "+result);
                            console.log("RESULT ROWS[0] -- "+result.rows[0]);
                            if(result.length==0 || result.rows[0]==undefined || result.rows[0]=='undefined'){
                                client.query(
                                    'SELECT course_name FROM public.language_courses WHERE course_code=$1', [course_code], // assuming the last final is never a language course
                                    function(err, result) {
                                        if (err) {
                                            console.log(err);
                                            callback('CANNOT FIND LANGUAGE COURSE WITH THIS CODE '+course_code);
                                        } else {
                                            console.log("ITS A LANG COURSE");
                                            callback(result.rows[0].course_name);
                                        };
                                    });
                            }else{
                                console.log("ITS A CS COURSE");
                                callback(result.rows[0].course_name);
                            }
                            
                        };
                    });
        });
        pool.end();
    },

    getFirstFinalInfo: function(callback, courses){
        this.getAllFinals(function(coursesAndDates){
            let courseFinalDates = [];
            let allCourses = coursesAndDates[0];
            console.log(courses);
            let allDates = coursesAndDates[1];
            for(let i=0; i<courses.length; i++){
                let index = allCourses.indexOf(courses[i]);
                courseFinalDates.push(allDates[index]);
            }
            let index = 0;
            let minDate = courseFinalDates[index];
            while(minDate==undefined){
                index++;
                minDate = courseFinalDates[index];
            }
            let minDateIndex = index;
            for(let i=1; i<courses.length; i++){
                //console.log(minDate+" < "+courseFinalDates[i]);
                if(courseFinalDates[i]!=undefined){
                    let temp1 = minDate.split("/");
                    let temp2 = courseFinalDates[i].split("/");
                    if(parseInt(temp1[2])>parseInt(temp2[2])){ // year is smaller
                        console.log(minDate+" > "+courseFinalDates[i] + " FIRST IF STAT");
                        minDate = courseFinalDates[i];
                        minDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])>parseInt(temp2[1])){ // same year, month is smaller
                            console.log(minDate+" > "+courseFinalDates[i] + " SECOND IF STAT");
                            minDate = courseFinalDates[i];
                            minDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])==parseInt(temp2[1]) && parseInt(temp1[0])>parseInt(temp2[0])){ // same year, same month, day is smaller
                                console.log(minDate+" > "+courseFinalDates[i]  + " THIRD IF STAT");
                                minDate = courseFinalDates[i];
                                minDateIndex = i;
                            }else{
                                console.log(minDate+" < "+courseFinalDates[i]);
                            }
                        }
                        
                    }
                }
               
            }
            console.log("CODE == "+courses[minDateIndex]+"  DATE == "+minDate);
            callback([courses[minDateIndex],minDate]);
            
        });
        
    },

    getLastFinalInfo: function(callback, courses){
        this.getAllFinals(function(coursesAndDates){
            let courseFinalDates = [];
            let allCourses = coursesAndDates[0];
            console.log(courses);
            let allDates = coursesAndDates[1];
            for(let i=0; i<courses.length; i++){
                let index = allCourses.indexOf(courses[i]);
                courseFinalDates.push(allDates[index]);
            }
            let index = 0;
            let maxDate = courseFinalDates[index];
            while(maxDate==undefined){
                index++;
                maxDate = courseFinalDates[index];
            }
            let maxDateIndex = index;
            for(let i=1; i<courses.length; i++){
                //console.log(maxDate+" < "+courseFinalDates[i]);
                if(courseFinalDates[i]!=undefined){
                    let temp1 = maxDate.split("/");
                    let temp2 = courseFinalDates[i].split("/");
                    if(parseInt(temp1[2])<parseInt(temp2[2])){ // year is greater
                        console.log(maxDate+" < "+courseFinalDates[i] + " FIRST IF STAT");
                        maxDate = courseFinalDates[i];
                        maxDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])<parseInt(temp2[1])){ // same year, month is greater
                            console.log(maxDate+" < "+courseFinalDates[i] + " SECOND IF STAT");
                            maxDate = courseFinalDates[i];
                            maxDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])==parseInt(temp2[1]) && parseInt(temp1[0])<parseInt(temp2[0])){ // same year, same month, day is greater
                                console.log(maxDate+" < "+courseFinalDates[i]  + " THIRD IF STAT");
                                maxDate = courseFinalDates[i];
                                maxDateIndex = i;
                            }else{
                                console.log(maxDate+" > "+courseFinalDates[i]);
                            }
                        }
                        
                    }
                }
                
            }
            console.log("CODE == "+courses[maxDateIndex]+"  DATE == "+maxDate);
            callback([courses[maxDateIndex],maxDate]);
            
        });
        
    },

    getFirstMidtermInfo: function(callback, courses){
        this.getAllMidterms(function(coursesAndDates){
            let coursesMinusDeutsch = courses.filter(function(course){ return course!='DE101' && course!='DE202' && course!='DE303' && course!='DE404'});
            let courseMidtermDates = [];
            let allCourses = coursesAndDates[0];
            console.log(coursesMinusDeutsch);
            let allDates = coursesAndDates[1];
            for(let i=0; i<coursesMinusDeutsch.length; i++){
                let index = allCourses.indexOf(coursesMinusDeutsch[i]);
                courseMidtermDates.push(allDates[index]);
            }
            let index = 0;
            let minDate = courseMidtermDates[index];
            while(minDate==undefined){
                index++;
                minDate = courseMidtermDates[index];
            }
            let minDateIndex = index;
            for(let i=1; i<coursesMinusDeutsch.length; i++){
                //console.log(minDate+" < "+courseMidtermDates[i]);
                if(courseMidtermDates[i]!=undefined){
                    let temp1 = minDate.split("/");
                    let temp2 = courseMidtermDates[i].split("/");
                    if(parseInt(temp1[2])>parseInt(temp2[2])){ // year is smaller
                        console.log(minDate+" > "+courseMidtermDates[i] + " FIRST IF STAT");
                        minDate = courseMidtermDates[i];
                        minDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])>parseInt(temp2[1])){ // same year, month is smaller
                            console.log(minDate+" > "+courseMidtermDates[i] + " SECOND IF STAT");
                            minDate = courseMidtermDates[i];
                            minDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])==parseInt(temp2[1]) && parseInt(temp1[0])>parseInt(temp2[0])){ // same year, same month, day is smaller
                                console.log(minDate+" > "+courseMidtermDates[i]  + " THIRD IF STAT");
                                minDate = courseMidtermDates[i];
                                minDateIndex = i;
                            }else{
                                console.log(minDate+" < "+courseMidtermDates[i]);
                            }
                        }
                        
                    }
                }
                
            }
            console.log("CODE == "+coursesMinusDeutsch[minDateIndex]+"  DATE == "+minDate);
            callback([coursesMinusDeutsch[minDateIndex],minDate]);
            
        });
        
    },

    getLastMidtermInfo: function(callback, courses){
        this.getAllMidterms(function(coursesAndDates){
            let coursesMinusDeutsch = courses.filter(function(course){ return course!='DE101' && course!='DE202' && course!='DE303' && course!='DE404'});
            let courseMidtermDates = [];
            let allCourses = coursesAndDates[0];
            console.log(allCourses);
            console.log(coursesMinusDeutsch);
            let allDates = coursesAndDates[1];
            for(let i=0; i<coursesMinusDeutsch.length; i++){
                let index = allCourses.indexOf(coursesMinusDeutsch[i]);
                console.log(allDates[index]);
                courseMidtermDates.push(allDates[index]);
            }
            let index = 0;
            let maxDate = courseMidtermDates[index];
            while(maxDate==undefined){
                index++;
                maxDate = courseMidtermDates[index];
            }
            let maxDateIndex = index;
            for(let i=1; i<coursesMinusDeutsch.length; i++){
                //console.log(maxDate+" < "+courseMidtermDates[i]);
                if(courseMidtermDates[i]!=undefined){
                    let temp1 = maxDate.split("/");
                    let temp2 = courseMidtermDates[i].split("/");
                    if(parseInt(temp1[2])<parseInt(temp2[2])){ // year is smaller
                        console.log(maxDate+" < "+courseMidtermDates[i] + " FIRST IF STAT");
                        maxDate = courseMidtermDates[i];
                        maxDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])<parseInt(temp2[1])){ // same year, month is smaller
                            console.log(maxDate+" < "+courseMidtermDates[i] + " SECOND IF STAT");
                            maxDate = courseMidtermDates[i];
                            maxDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])==parseInt(temp2[1]) && parseInt(temp1[0])<parseInt(temp2[0])){ // same year, same month, day is smaller
                                console.log(maxDate+" < "+courseMidtermDates[i]  + " THIRD IF STAT");
                                maxDate = courseMidtermDates[i];
                                maxDateIndex = i;
                            }else{
                                console.log(maxDate+" > "+courseMidtermDates[i]);
                            }
                        }
                        
                    }
                }
                
                
            }
            console.log("CODE == "+coursesMinusDeutsch[maxDateIndex]+"  DATE == "+maxDate);
            callback([coursesMinusDeutsch[maxDateIndex],maxDate]);
            
        });
        
    },

    getFirstQuizInfo : function(callback, courses){
        this.getAllQuizzes(function(coursesAndDates){
            let coursesMinusLanguages = courses.filter(function(course){ return course!='DE101' && course!='DE202' && course!='DE303' && course!='DE404' && course!='AE101' && course!='AS102' && course!='SM101' && course!='CPS402' && course!='RPW401'});
            let courseQuizDates = [];
            let allCourses = coursesAndDates[0];
            console.log(coursesMinusLanguages);
            let allDates = coursesAndDates[1];
            for(let i=0; i<coursesMinusLanguages.length; i++){
                let index = allCourses.indexOf(coursesMinusLanguages[i]);
                courseQuizDates.push(allDates[index]);
            }
            let index = 0;
            let minDate = courseQuizDates[index];
            while(minDate==undefined){
                index++;
                minDate = courseQuizDates[index];
            }
            let minDateIndex = index;
            for(let i=index+1; i<coursesMinusLanguages.length; i++){
                //console.log(minDate+" < "+courseQuizDates[i]);
                if(courseQuizDates[i]!=undefined){
                    let temp1 = minDate.split("/");
                    let temp2 = courseQuizDates[i].split("/");
                    if(parseInt(temp1[2])>parseInt(temp2[2])){ // year is smaller
                        console.log(minDate+" > "+courseQuizDates[i] + " FIRST IF STAT");
                        minDate = courseQuizDates[i];
                        minDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])>parseInt(temp2[1])){ // same year, month is smaller
                            console.log(minDate+" > "+courseQuizDates[i] + " SECOND IF STAT");
                            minDate = courseQuizDates[i];
                            minDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])==parseInt(temp2[1]) && parseInt(temp1[0])>parseInt(temp2[0])){ // same year, same month, day is smaller
                                console.log(minDate+" > "+courseQuizDates[i]  + " THIRD IF STAT");
                                minDate = courseQuizDates[i];
                                minDateIndex = i;
                            }else{
                                console.log(minDate+" < "+courseQuizDates[i]);
                            }
                        }
                        
                    }
                }
                   
            }
            console.log("CODE == "+coursesMinusLanguages[minDateIndex]+"  DATE == "+minDate);
            callback([coursesMinusLanguages[minDateIndex],minDate]);
            
        });
        
    },

    getLastQuizInfo: function(callback, courses){
        this.getAllQuizzes(function(coursesAndDates){
            let coursesMinusLanguages = courses.filter(function(course){ return course!='DE101' && course!='DE202' && course!='DE303' && course!='DE404' && course!='AE101' && course!='AS102' && course!='SM101' && course!='CPS402' && course!='RPW401'});
            let courseQuizDates = [];
            let allCourses = coursesAndDates[0];
            console.log(allCourses);
            console.log(coursesMinusLanguages);
            let allDates = coursesAndDates[1];
            for(let i=0; i<coursesMinusLanguages.length; i++){
                let index = allCourses.indexOf(coursesMinusLanguages[i]);
                console.log(allDates[index]);
                courseQuizDates.push(allDates[index]);
            }
            let index = 0;
            let maxDate = courseQuizDates[index];
            while(maxDate==undefined){
                index++;
                maxDate = courseQuizDates[index];
            }
            let maxDateIndex = index;
            for(let i=1; i<coursesMinusLanguages.length; i++){
                //console.log(maxDate+" < "+courseQuizDates[i]);
                if(courseQuizDates[i]!=undefined){
                    let temp1 = maxDate.split("/");
                    let temp2 = courseQuizDates[i].split("/");
                    if(parseInt(temp1[2])<parseInt(temp2[2])){ // year is smaller
                        console.log(maxDate+" < "+courseQuizDates[i] + " FIRST IF STAT");
                        maxDate = courseQuizDates[i];
                        maxDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])<parseInt(temp2[1])){ // same year, month is smaller
                            console.log(maxDate+" < "+courseQuizDates[i] + " SECOND IF STAT");
                            maxDate = courseQuizDates[i];
                            maxDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(temp2[2]) && parseInt(temp1[1])==parseInt(temp2[1]) && parseInt(temp1[0])<parseInt(temp2[0])){ // same year, same month, day is smaller
                                console.log(maxDate+" < "+courseQuizDates[i]  + " THIRD IF STAT");
                                maxDate = courseQuizDates[i];
                                maxDateIndex = i;
                            }else{
                                console.log(maxDate+" > "+courseQuizDates[i]);
                            }
                        }
                        
                    }
                }
                
            }
            console.log("CODE == "+coursesMinusLanguages[maxDateIndex]+"  DATE == "+maxDate);
            callback([coursesMinusLanguages[maxDateIndex],maxDate]);
            
        });
        
    },

    getNextQuizInfo: function(callback, courses){
        this.getAllQuizzes(function(coursesAndDates){
            
            //removing all language courses from the schedule
            let coursesMinusLanguages = courses.filter(function(course){ return course!='DE101' && course!='DE202' && course!='DE303' && course!='DE404' && course!='AE101' && course!='AS102' && course!='SM101' && course!='CPS402' && course!='RPW401'});
            
            let courseQuizDates = [];
            let courseQuizCodes = [];
            let allCourses = coursesAndDates[0];
            let allDates = coursesAndDates[1];
            let today = [new Date().getDate(), 1+new Date().getMonth(), new Date().getFullYear()];
            let temp1;
            for(let i=0; i<coursesMinusLanguages.length; i++){
                let thisCourse = coursesMinusLanguages[i];
                let index = allCourses.indexOf(thisCourse);
                while(index!=-1){
                    temp1 = allDates[index].split("/");
                    if((parseInt(temp1[2])==parseInt(today[2]) && parseInt(temp1[1])>parseInt(today[1])) || (parseInt(temp1[2])>parseInt(today[2])) || (parseInt(temp1[2])==parseInt(today[2]) && parseInt(temp1[1])==parseInt(today[1]) && parseInt(temp1[0])>parseInt(temp2[0])) ){ // quiz is any time after today
                        courseQuizDates.push(allDates[index]);
                        courseQuizCodes.push(thisCourse);
                    }
                    allCourses.splice(index,1);
                    allDates.splice(index,1);
                    index = allCourses.indexOf(thisCourse);
                }     
            }

            console.log("FILTERED COURSES DATES --> "+courseQuizDates);
            console.log("FILTERED COURSES --> "+courseQuizCodes);

            callback([courseQuizCodes,courseQuizDates]);

            /*

            let index = 0;
            let minDate = courseQuizDates[index];
            while(minDate==undefined){
                index++;
                minDate = courseQuizDates[index];
            }
            let minDateIndex = index;
            for(let i=index+1; i<courseQuizCodes.length; i++){
                if(courseQuizDates[i]!=undefined){
                    temp1 = minDate.split("/");
                    today = courseQuizDates[i].split("/");
                    if(parseInt(temp1[2])>parseInt(today[2])){ // year is smaller
                        //console.log(minDate+" > "+courseQuizDates[i] + " FIRST IF STAT");
                        minDate = courseQuizDates[i];
                        minDateIndex = i;
                    }else{
                        if(parseInt(temp1[2])==parseInt(today[2]) && parseInt(temp1[1])>parseInt(today[1])){ // same year, month is smaller
                            //console.log(minDate+" > "+courseQuizDates[i] + " SECOND IF STAT");
                            minDate = courseQuizDates[i];
                            minDateIndex = i;
                        }else{
                            if(parseInt(temp1[2])==parseInt(today[2]) && parseInt(temp1[1])==parseInt(today[1]) && parseInt(temp1[0])>parseInt(today[0])){ // same year, same month, day is smaller
                                //console.log(minDate+" > "+courseQuizDates[i]  + " THIRD IF STAT");
                                minDate = courseQuizDates[i];
                                minDateIndex = i;
                            }else{
                                console.log(minDate+" < "+courseQuizDates[i]);
                            }
                        }
                        
                    }
                }
                   
            }
            
            console.log("CODE == "+courseQuizCodes[minDateIndex]+"  DATE == "+minDate);
            callback([courseQuizCodes[minDateIndex],minDate]);

            */
            
        });
        
    },

    getAllQuizzes: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    `SELECT course_code,quiz_date FROM public.quizzes`,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {
                            let courses = [];
                            let dates = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                courses.push(result.rows[i].course_code);
                                dates.push(result.rows[i].quiz_date.getDate()+"/"+(1+parseInt(result.rows[i].quiz_date.getMonth()))+"/"+result.rows[i].quiz_date.getFullYear());
                            }
                            callback([courses,dates]);
                        };
                    });
        });
        pool.end();
    },

    getAllMidterms: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    `SELECT course_code,midterm_date FROM public.midterms`,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {
                            let courses = [];
                            let dates = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                courses.push(result.rows[i].course_code);
                                dates.push(result.rows[i].midterm_date.getDate()+"/"+(1+parseInt(result.rows[i].midterm_date.getMonth()))+"/"+result.rows[i].midterm_date.getFullYear());
                            }
                            callback([courses,dates]);
                        };
                    });
        });
        pool.end();
    },

    getAllFinals: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    `SELECT course_code,final_date FROM public.finals`,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {
                            let courses = [];
                            let dates = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                courses.push(result.rows[i].course_code);
                                dates.push(result.rows[i].final_date.getDate()+"/"+(1+parseInt(result.rows[i].final_date.getMonth()))+"/"+result.rows[i].final_date.getFullYear());
                            }
                            callback([courses,dates]);
                        };
                    });
        });
        pool.end();
    }

}
