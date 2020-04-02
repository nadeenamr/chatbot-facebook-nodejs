'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
const prolog = require('./prolog');
pg.defaults.ssl = true;


module.exports = {

    getAllHolidays: function(callback){
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

    },

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


}

