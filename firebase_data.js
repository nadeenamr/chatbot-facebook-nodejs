
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

rootRef.child('holidays').set(
    {
        'Palm Sunday & Western Easter':{
            start_date:"2020-04-12",
            end_date:"2020-04-12"
        },
        'Holy Thursday':{
            start_date:"2020-04-16",
            end_date:"2020-04-16"
        },
        'Eastern Easter':{
            start_date:"2020-04-19",
            end_date:"2020-04-19"
        },
        'Sham El Nessim':{
            start_date:"2020-04-20",
            end_date:"2020-04-20"
        }, 
        'Sinai Liberation Day':{
            start_date:"2020-04-25",
            end_date:"2020-04-25"
        }, 
        'Labor Day':{
            start_date:"2020-05-01",
            end_date:"2020-05-01"
        }, 
        'Eid El Fitr':{
            start_date:"2020-05-24",
            end_date:"2020-05-26"
        },
        'National Day':{
            start_date:"2020-01-25",
            end_date:"2020-01-25"
        }
    },  function(error){
        if(error){
            console.log(error);
        }else {
            console.log("holidays have been saved successfully");
        }     
    });

    //".validate": "newData.isString() && newData.val().matches(/^(19|20)[0-9][0-9][-\\/. ](0[1-9]|1[012])[-\\/. ](0[1-9]|[12][0-9]|3[01])$/)"

    /*

    checkIfAppliedBeforeDB = function (userId,responseText, isArabic) {
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
        console.log('fetching user');
        const appliedBeforeRef = rootRef.child('users').child(userId);
        appliedBeforeRef.on('value',snap=>{
        if(snap.val())
        {
            if(snap.val().applied) agentController.sendTextMessage(userId,"You've already applied once!\nYou can't apply twice 😅😅😅", isArabic);
            else agentController.sendTextMessage(userId,responseText, isArabic);	
        }
        else
        console.log("user not found");
        });
    } else {
                    console.log("Cannot get data for fb user with id",
                        userId);
                }
            } else {
                console.error(response.error);
            }
    
        });
    }

    */