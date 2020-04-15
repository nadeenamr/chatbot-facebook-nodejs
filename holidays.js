'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
const prolog = require('./prolog');
pg.defaults.ssl = true;

//--import firebase db--
const firebase = require('firebase-admin');

//--connect to firebase db--
const serviceAccount =require('./config/serviceAccountKey.json'); 

console.log(serviceAccount.type);

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://advisingagent-bbwsrq.firebaseio.com"
});

const rootRef = firebase.database().ref();

module.exports = {

    getAllHolidays: function(callback){

        let holidaysList = [];
        let holidaysRef = rootRef.child('holidays');
        holidaysRef.on(function(value){
            if(snap.val()) {
                for(let i=0; i<snap.val().CS;i++){
                    holidaysList.push(snap.val());
                }
            }
        });

        callback(holidaysList);
        
    },
        /*

        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client.query(
                    `SELECT holiday_name,holiday_start_date,holiday_end_date FROM public.holidays`,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {
                            let holidays = "";
                            let holiday, start_date, end_date, sdate, edate;
                            for (let i = 0; i < result.rows.length; i++) {
                                holiday = result.rows[i].holiday_name;
                                start_date = result.rows[i].holiday_start_date;
                                end_date = result.rows[i].holiday_end_date;
                                sdate = start_date.getDate()+"/"+(1+parseInt(start_date.getMonth()))+"/"+start_date.getFullYear();
                                if(parseInt(start_date.getDate())==parseInt(end_date.getDate()) && parseInt(start_date.getMonth())==parseInt(end_date.getMonth()) && parseInt(start_date.getFullYear())==parseInt(end_date.getFullYear())){
                                    holidays += "\n 🎑 "+holiday+" is on "+sdate;
                                }else{
                                    edate = end_date.getDate()+"/"+(1+parseInt(end_date.getMonth()))+"/"+end_date.getFullYear();
                                    holidays += "\n 🎑 "+holiday+" is from "+sdate+" till "+edate;
                                }
                                
                            }
                            callback(holidays);
                        };
                    });
        });
        pool.end();

        */

    getSpecificHoliday: function(callback, holidayName){
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client.query(
                    `SELECT holiday_start_date,holiday_end_date FROM public.holidays WHERE holiday_name=$1`,
                    [holidayName],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {
                            if(result==undefined){
                                callback('No information about this holiday available yet :(');
                            }else{
                                let start_date, end_date, sdate, edate;
                                start_date = result.rows[0].holiday_start_date;
                                end_date = result.rows[0].holiday_end_date;
                                sdate = start_date.getDate()+"/"+(1+parseInt(start_date.getMonth()))+"/"+start_date.getFullYear();
                                if(parseInt(start_date.getDate())==parseInt(end_date.getDate()) && parseInt(start_date.getMonth())==parseInt(end_date.getMonth()) && parseInt(start_date.getFullYear())==parseInt(end_date.getFullYear())){
                                    callback(holidayName+" is on "+sdate);
                                }else{
                                    edate = end_date.getDate()+"/"+(1+parseInt(end_date.getMonth()))+"/"+end_date.getFullYear();
                                    callback(holidayName+" is from "+sdate+" till "+edate);
                                }
                            }
                            
                        };
                    });
        });
        pool.end();

    },

    getNextHoliday: function(callback){
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client.query(
                    `SELECT holiday_name,holiday_start_date,holiday_end_date FROM public.holidays`,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback('');
                        } else {

                            let holidays = [];

                            let today = new Date();
                            let todayDay = today.getDate();
                            let todayMonth = 1 + parseInt(today.getMonth());
                            let todayYear = today.getFullYear();

                            let holidayName;
                            let holidayDay;
                            let holidayMonth;;
                            let holidayYear;
                            let holidayEndDate; 

                            for (let i = 0; i < result.rows.length; i++) { // get all dates greater than today
                                holidayName = result.rows[i].holiday_name;
                                holidayDay = result.rows[i].holiday_start_date.getDate();
                                holidayMonth = 1+parseInt(result.rows[i].holiday_start_date.getMonth());
                                holidayYear = result.rows[i].holiday_start_date.getFullYear();
                                holidayEndDate = result.rows[i].holiday_end_date;
                                if((todayYear==holidayYear && holidayMonth>todayMonth) || (holidayYear>todayYear) || (holidayYear==todayYear && holidayMonth==todayMonth && holidayDay>todayDay) ){ 
                                    holidays.push(holidayName+","+holidayDay+","+ holidayMonth+","+ holidayYear+","+ holidayEndDate);
                                    console.log(holidayName+"/"+holidayDay+"/"+ holidayMonth+"/"+ holidayYear+"/"+ holidayEndDate);
                                }
                            }

                            console.log(holidays);

                            let string = holidays[0].split(",");

                            let nearestName = string[0];
                            let nearestDay = string[1];
                            let nearestMonth = string[2];
                            let nearestYear = string[3];
                            let nearestEndDate = new Date(string[4]);

                            console.log("NEAREST BEFORE = "+nearestName+","+nearestDay+","+ nearestMonth+","+ nearestYear+","+ nearestEndDate);

                            for(let i=1; i<holidays.length; i++){ // get the smallest
                                string = holidays[i].split(",");
                                holidayName = string[0];
                                holidayDay = string[1];
                                holidayMonth = string[2];
                                holidayYear = string[3];
                                holidayEndDate = string[4];
                                if((nearestYear==holidayYear && nearestMonth>holidayMonth) || (nearestYear>holidayYear) || (nearestYear==holidayYear && holidayMonth==nearestMonth && nearestDay>holidayDay) ){ 
                                    nearestName = holidayName;
                                    nearestDay = holidayDay;
                                    nearestMonth = holidayMonth;
                                    nearestYear = holidayYear;
                                    nearestEndDate = holidayEndDate;
                                }
                            }

                            console.log("NEAREST AFTER = "+nearestName+","+nearestDay+","+ nearestMonth+","+ nearestYear+","+ nearestEndDate);


                            let edd = nearestEndDate.getDate();
                            let edm = 1 + parseInt(nearestEndDate.getMonth());
                            let edy = nearestEndDate.getFullYear();
                            console.log(edd+" "+edm+" "+edy)

                            if(nearestDay==edd && nearestMonth==edm && nearestYear==edy){
                                callback(nearestName+" is on "+nearestDay+"/"+nearestMonth+"/"+nearestYear);
                            }else{
                                callback(nearestName+" is from "+nearestDay+"/"+nearestMonth+"/"+nearestYear+" till "+edd+"/"+edm+"/"+edy);
                            }
                        };
                    });
        });
        pool.end();

    }


}

