'use strict';

const apiai = require('apiai');
const config = require('./config');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const pg = require('pg');
const app = express();
const uuid = require('uuid');
const userData = require('./user');
const students = require('./students');
const courses = require('./courses');
const prolog = require('./prolog');
const emoji = require('node-emoji');
const emojinames = require("emoji-names");

pg.defaults.ssl = true;

// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
	throw new Error('missing FB_PAGE_TOKEN');
}
if (!config.FB_VERIFY_TOKEN) {
	throw new Error('missing FB_VERIFY_TOKEN');
}
if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
	throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
if (!config.FB_APP_SECRET) {
	throw new Error('missing FB_APP_SECRET');
}
if (!config.SERVER_URL) { //used for ink to static files
	throw new Error('missing SERVER_URL');
}

if(!config.PG_CONFIG){ //postgresql config object
	throw new Error('missing PG_CONFIG');
}

app.set('port', (process.env.PORT || 5000))

//verify request came from facebook
app.use(bodyParser.json({
	verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}))

// Process application/json
app.use(bodyParser.json())

const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {language: "en", requestSource: "fb"});
const sessionIds = new Map();
const usersMap = new Map();

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	console.log("request");
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
})	  

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook/', function (req, res) {
	var data = req.body;
	console.log(JSON.stringify(data));

	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});

function setSessionAndUser(senderID){
	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}

	if(!usersMap.has(senderID)){
		userData(function(user){
			usersMap.set(senderID, user);
		}, senderID);
	}
}

function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	setSessionAndUser(senderID);
	//console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
	//console.log(JSON.stringify(message));

	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;

	if (isEcho) {
		handleEcho(messageId, appId, metadata);
		return;
	} else if (quickReply) {
		handleQuickReply(senderID, quickReply, messageId);
		return;
	}


	if (messageText) {
		//send message to api.ai
		sendToApiAi(senderID, messageText);
	} else if (messageAttachments) {
		handleMessageAttachments(messageAttachments, senderID);
	}
}

function handleMessageAttachments(messageAttachments, senderID){
	//for now just reply
	sendTextMessage(senderID, "Attachment received. Thank you.");	
}

function handleQuickReply(senderID, quickReply, messageId) {
	var quickReplyPayload = quickReply.payload;
	console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
	//send payload to api.ai
	sendToApiAi(senderID, quickReplyPayload);
}

function handleEcho(messageId, appId, metadata) { //https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
	// Just logging message echoes to console
	console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
	switch (action) {
		case "getSemesterCourses":
			courses.readAllCSSemesterCourses(function(allCourses){
				let allCoursesString = allCourses.join(", ");
				let reply = `Courses in semester ${parameters['semesters']} curriculum are: ${allCoursesString}.`;
				sendGifMessage("https://media.giphy.com/media/l2QEkuf4oMtqSuKR2/giphy.gif",sender);
				setTimeout(function(){ sendTextMessage(sender, reply); }, 6000);
				}, parameters['semesters']);
			break;
		case "myFirstQuiz":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getFirstQuizInfo(function(firstCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `OK, so according to my calculations, your first quiz is ${firstCodeDate[0]}: ${courseName} and so far it's expected to be on ${firstCodeDate[1]} (although keep an eye out for any adjustments through the guc mail) `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/HPF6ivflFs7U4/giphy.gif",sender);
						},firstCodeDate[0]);
					},courseList);
				}, studentIDAndTranscript); 
			}, sender);
			break;
		case "myLastQuiz":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getLastQuizInfo(function(lastCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `OK, so according to my calculations, the last quiz in the semester for you is ${lastCodeDate[0]}: ${courseName} and so far it's expected to be on ${lastCodeDate[1]} (although keep an eye out for any adjustments through the guc mail) `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/hYrwRki5WYoZW/giphy.gif",sender);
						},lastCodeDate[0]);
					},courseList);
				}, studentIDAndTranscript); 
			}, sender);
			break;
		case "myFirstMidterm":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getFirstMidtermInfo(function(firstCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `Lets see here... your first midterm is ${firstCodeDate[0]}: ${courseName} and so far it's expected to be on ${firstCodeDate[1]} (although keep an eye out for any adjustments through the guc mail) `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/ZY2SFqgEjg0d3YuDfI/giphy.gif",sender);
						},firstCodeDate[0]);
					},courseList);
				}, studentIDAndTranscript); 
			}, sender);
			break;
		case "myLastMidterm":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getLastMidtermInfo(function(lastCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `Lets see here... your last midterm is ${lastCodeDate[0]}: ${courseName} and so far it's expected to be on ${lastCodeDate[1]} (although keep an eye out for any adjustments through the guc mail) `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/iaAllc4p32AXC/giphy.gif",sender);
						},lastCodeDate[0]);
					},courseList);
				}, studentIDAndTranscript); 
			}, sender);
			break;
		case "myFirstFinal":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getFirstFinalInfo(function(firstCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `Lets see here... your first final is ${firstCodeDate[0]}: ${courseName} and so far it's expected to be on ${firstCodeDate[1]} (although keep an eye out for any adjustments through the guc mail) `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/25EAreLnZIFWasblJe/giphy.gif",sender);
						},firstCodeDate[0]);
					},courseList);
				}, studentIDAndTranscript); 
			}, sender);
			break;
		case "myLastFinal":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getLastFinalInfo(function(finalCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `Lets see here... your last final is ${finalCodeDate[0]}: ${courseName} and so far it's expected to be on ${finalCodeDate[1]} (although keep an eye out for any adjustments through the guc mail) `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/3o84UdRSymVQCrZT6E/giphy.gif",sender);
						},finalCodeDate[0]);
					},courseList);
				}, studentIDAndTranscript); 
			}, sender);
			break;
		case "mySchedule":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let reply = `Here's a suggested schedule for the next semester `+emoji.get('wink')+`\nCourses: ${allCourses}.`;
					sendTextMessage(sender, reply);
					sendGifMessage("https://media.giphy.com/media/g0NZy8CjNDQ2K2DnG5/giphy.gif",sender);
				}, studentIDAndTranscript);
			}, sender);
			break;
		case "welcomeUser":
				students.newOrRegularStudent(function(isRegular){
					let reply;
					if(isRegular[0]=="new"){
						reply = "Welcome "+ isRegular[1] +"! "+'👋🏼'+" I'm your MET Mentor!\nI can answer any questions you might have and offer support/advice for MET students. Please enter your GUC ID so I am able to access your records."; 
						sendTextMessage(sender, reply);
						sendGifMessage("https://giphy.com/gifs/cbc-schittscreek-schitts-creek-88iGfhImcQ7mkbyuiS",sender);
					}else{
						if(isRegular[0]=="old"){
							reply = "Welcome back "+ isRegular[1] +"! "+'👋🏼'+"\nHow can I help you today? "+'👩🏼‍💼';
							//sendGifMessage("https://media.giphy.com/media/lTkG4o9F8TVLgDDdng/giphy.gif",sender); 
							sendTextMessage(sender, reply);							
						}else{
							reply = "Hello There! How may I help you";
							sendTextMessage(sender, reply);
						}
					}
					
				}, sender);
			break;
		case "takingStudentID":
			if(isDefined(contexts[0])&&contexts[0].parameters['studentID']){
				students.saveStudentID(contexts[0].parameters['studentID'], sender);
				sendTextMessage(sender, "Amazing! I also need your GUC username");
			}
			break;
		case "takingStudentUsername":
			if(isDefined(contexts[0])&&contexts[0].parameters['studentUsername']){
				students.saveStudentUsername(contexts[0].parameters['studentUsername'], sender);
				sendTextMessage(sender, "Perfect "+'👌🏼'+" I have everything I need! Tell me, how can I be of service to you?");
			}
			break;
		case "getCoursePrerequisite": 
			courses.readCoursePrereqs(function(codes){
				if(codes==""){
					sendTextMessage(sender, "This course has no prerequisites.");
				}else{
					let allCoursesString = codes.join(", ");
					let reply = `Prerequisite courses are: ${allCoursesString}.`;
					sendTextMessage(sender, reply);
				}
			}, parameters['courses']);
			break;
		case "cs_sem_courses":
			courses.readAllCSSemesterCourses(function(allCourses){
				let allCoursesString = allCourses.join(", ");
				let reply = `Course codes are: ${allCoursesString}.`;
				sendTextMessage(sender, reply);
				}, parameters['semesters']);
			break;
		case "dmet_sem_courses":
			courses.readAllDMETSemesterCourses(function(allCourses){
				let allCoursesString = allCourses.join(", ");
				let reply = `Course codes are: ${allCoursesString}.`;
				sendTextMessage(sender, reply);
				}, parameters['semesters']);
			break;
		// video no.35
		case "detailed_applications": 
			if(isDefined(contexts[0]) && contexts[0].parameters['user_name'] && contexts[0].parameters['id'] && contexts[0].parameters['semester'] && contexts[0].parameters['major'] && contexts[0].parameters){
				let user_name = (isDefined(contexts[0].parameters['user_name']) && contexts[0].parameters['user_name']!='') ? contexts[0].parameters['user_name'] : '';
				let id = (isDefined(contexts[0].parameters['id']) && contexts[0].parameters['id']!='') ? contexts[0].parameters['id'] : '';
				let semester = (isDefined(contexts[0].parameters['semester']) && contexts[0].parameters['semester']!='') ? contexts[0].parameters['semester'] : '';
				let major = (isDefined(contexts[0].parameters['major']) && contexts[0].parameters['major']!='') ? contexts[0].parameters['major'] : '';
				
				if(user_name!='' && id!='' && semester!='' && major==''){
					let replies = [
						{ "content_type": "text", "title": "CS", "payload": "CS"},
						{ "content_type": "text", "title": "DMET", "payload": "DMET"}
					];
					sendQuickReply(sender, responseText, replies);
				}else{
					if(user_name!='' && id!='' && semester!='' && major!=''){
						responseText = "Thank you for using AA, "+user_name+". Hope studying "+major+" at the GUC is bringing you closer to your future path. Any concerns regarding any courses or inquiries about semester " + semester + " feel free to ask."
						setTimeout(function(){
							let buttons = [
								/*{ type: "web_url", url: "https://www.google.com", title: "Go to Google" },*/
								{ type: "phone_number", payload: "+2016482", title: "Call Hotline" },
								{ type: "postback", title: "Keep on Chatting", payload: "CHAT" },
								{ type: "postback", title: "Get Started", payload: "GET_STARTED" }
							];
							sendButtonMessage(sender, "What would you like to do next?", buttons);
						}, 3000);
						sendTextMessage(sender, responseText);
					}else{
						sendTextMessage(sender, responseText);
					}
				}				
			}else{
				sendTextMessage(sender, responseText);
			}
			break;
		default:
			//unhandled action, just send back the text
			sendTextMessage(sender, responseText);
	}
}

function handleMessage(message, sender) {
	switch (message.type) {
		case 0: //text
			sendTextMessage(sender, message.speech);
			break;
		case 2: //quick replies
			let replies = [];
			for (var b = 0; b < message.replies.length; b++) {
				let reply =
				{
					"content_type": "text",
					"title": message.replies[b],
					"payload": message.replies[b]
				}
				replies.push(reply);
			}
			sendQuickReply(sender, message.title, replies);
			break;
		case 3: //image
			sendImageMessage(sender, message.imageUrl);
			break;
		case 4:
			// custom payload
			var messageData = {
				recipient: {
					id: sender
				},
				message: message.payload.facebook

			};
			callSendAPI(messageData);
			break;
	}
}

function handleCardMessages(messages, sender) {

	let elements = [];
	for (var m = 0; m < messages.length; m++) {
		let message = messages[m];
		let buttons = [];
		for (var b = 0; b < message.buttons.length; b++) {
			let isLink = (message.buttons[b].postback.substring(0, 4) === 'http');
			let button;
			if (isLink) {
				button = {
					"type": "web_url",
					"title": message.buttons[b].text,
					"url": message.buttons[b].postback
				}
			} else {
				button = {
					"type": "postback",
					"title": message.buttons[b].text,
					"payload": message.buttons[b].postback
				}
			}
			buttons.push(button);
		}

		let element = {
			"title": message.title,
			"image_url":message.imageUrl,
			"subtitle": message.subtitle,
			"buttons": buttons
		};
		elements.push(element);
	}
	sendGenericMessage(sender, elements);
}

function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let messages = response.result.fulfillment.messages;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;

	sendTypingOff(sender);

	if (isDefined(messages) && (messages.length == 1 && messages[0].type != 0 || messages.length > 1)) {
		let timeoutInterval = 1100;
		let previousType ;
		let cardTypes = [];
		let timeout = 0;
		for (var i = 0; i < messages.length; i++) {

			if ( previousType == 1 && (messages[i].type != 1 || i == messages.length - 1)) {
				timeout = (i - 1) * timeoutInterval;
				setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
				cardTypes = [];
				timeout = i * timeoutInterval;
				setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
			} else if ( messages[i].type == 1 && i == messages.length - 1) {
				cardTypes.push(messages[i]);
                		timeout = (i - 1) * timeoutInterval;
                		setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                		cardTypes = [];
			} else if ( messages[i].type == 1 ) {
				cardTypes.push(messages[i]);
			} else {
				timeout = i * timeoutInterval;
				setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
			}

			previousType = messages[i].type;

		}
	} else if (responseText == '' && !isDefined(action)) {
		//api ai could not evaluate input.
		console.log('Unknown query' + response.result.resolvedQuery);
		sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
	} else if (isDefined(action)) {
		handleApiAiAction(sender, action, responseText, contexts, parameters);
	} else if (isDefined(responseData) && isDefined(responseData.facebook)) {
		try {
			console.log('Response as formatted message' + responseData.facebook);
			sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			sendTextMessage(sender, err.message);
		}
	} else if (isDefined(responseText)) {

		sendTextMessage(sender, responseText);
	}
}

function sendToApiAi(sender, text) {

	sendTypingOn(sender);
	let apiaiRequest = apiAiService.textRequest(text, {
		sessionId: sessionIds.get(sender)
	});

	apiaiRequest.on('response', (response) => {
		if (isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});

	apiaiRequest.on('error', (error) => console.error(error));
	apiaiRequest.end();
}

function sendTextMessage(recipientId, text) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text
		}
	}
	callSendAPI(messageData);
}

function sendImageMessage(recipientId, imageUrl) { // Send an image using the Send API.
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: imageUrl
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendGifMessage(gifAddress, recipientId) { // Send a Gif using the Send API.
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: gifAddress
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendAudioMessage(recipientId) { // Send audio using the Send API.
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "audio",
				payload: {
					url: config.SERVER_URL + "/assets/sample.mp3"
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendVideoMessage(recipientId, videoName) { // Send a video using the Send API --> example videoName: "/assets/allofus480.mov"
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "video",
				payload: {
					url: config.SERVER_URL + videoName
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendFileMessage(recipientId, fileName) { // Send a video using the Send API --> example fileName: fileName"/assets/test.txt"
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "file",
				payload: {
					url: config.SERVER_URL + fileName
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendButtonMessage(recipientId, text, buttons) { // Send a button message using the Send API.
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: text,
					buttons: buttons
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendGenericMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: elements
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
							timestamp, elements, address, summary, adjustments) {
	// Generate a random receipt ID as the API requires a unique ID
	var receiptId = "order" + Math.floor(Math.random() * 1000);

	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "receipt",
					recipient_name: recipient_name,
					order_number: receiptId,
					currency: currency,
					payment_method: payment_method,
					timestamp: timestamp,
					elements: elements,
					address: address,
					summary: summary,
					adjustments: adjustments
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendQuickReply(recipientId, text, replies, metadata) { // Send a message with Quick Reply buttons.
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text,
			metadata: isDefined(metadata)?metadata:'',
			quick_replies: replies
		}
	};

	callSendAPI(messageData);
}

function sendReadReceipt(recipientId) { // Send a read receipt to indicate the message has been read

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "mark_seen"
	};

	callSendAPI(messageData);
}

function sendTypingOn(recipientId) { // Turn typing indicator on

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	callSendAPI(messageData);
}

function sendTypingOff(recipientId) { // Turn typing indicator off


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_off"
	};

	callSendAPI(messageData);
}

function sendAccountLinking(recipientId) { // Send a message with the account linking call-to-action
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "Welcome. Link your account.",
					buttons: [{
						type: "account_link",
						url: config.SERVER_URL + "/authorize"
          }]
				}
			}
		}
	};

	callSendAPI(messageData);
}

function greetUserText(userId) {
	
	let user = usersMap.get(userId);

	sendTextMessage(userId, "Welcome " + user.first_name + '!' + 
	'I can answer any questions you might have and offer support/advice for MET students. What can I help you with?');

}

function callSendAPI(messageData) { // Call the Send API. The message data goes in the body. If successful, we'll get the message id in a response 
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: config.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	setSessionAndUser(senderID);
	// The 'payload' param is a developer-defined field which is set in a postback 
	// button for Structured Messages. 
	var payload = event.postback.payload;

	switch (payload) {
		case "Get started":
				sendToApiAi(senderID, "Hi");
			break;
		case "GET_DMET_SEM_COURSES": 
				sendToApiAi(senderID, "dmet semester courses");
			break;
		case "GET_CS_SEM_COURSES": 
				sendToApiAi(senderID, "cs semester courses");
			break;
		case "GET_CS_DMET_DIFF":
				sendToApiAi(senderID, "What is the difference between CS and DMET?");
			break;
		case "GET_FIRST_FINAL": 
			sendToApiAi(senderID, "first final");
			break;
		case "GET_LAST_FINAL": 
				sendToApiAi(senderID, "last final");
			break;
		case "GET_FIRST_MIDTERM": 
			sendToApiAi(senderID, "first midterm");
			break;
		case "GET_LAST_MIDTERM": 
				sendToApiAi(senderID, "last midterm");
			break;
		case "GET_SCHEDULE": 
			sendToApiAi(senderID, "schedule");
			break;
		default:
			//unindentified payload
			sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
			break;

	}

	console.log("Received postback for user %d and page %d with payload '%s' " +
		"at %d", senderID, recipientID, payload, timeOfPostback);

}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	console.log("Received account link event with for user %d with status %s " +
		"and auth code %s ", senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function (messageID) {
			console.log("Received delivery confirmation for message ID: %s",
				messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the 
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger' 
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		throw new Error('Couldn\'t validate the signature.');
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', config.FB_APP_SECRET)
			.update(buf)
			.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})









/*


fb-persistent-menu --token <EAACkvzAhabEBAHPfEKFcGaqfWQfaKDZAceGo8oP6jkuRkAJLSQNzt4GDbyXkYEQOwd5EZAkFpBJDosf2qjcPOpsq5iMRwBl6yhL6LZAcpnB1SUuWo9OxZAdJpKqOptJtij9QnBjA46yaZAFr3f1wVZBYaZA3xEFZCLMQxJDbDJjPcy5KPmmZB0amp> --settings '{
	"persistent_menu": [
		{
			"locale": "default",
			"composer_input_disabled": false,
			"call_to_actions": [
				{
					"type": "nested",
					"title": "MET",
					"call_to_actions": [
						  {
								"type": "postback",
								"title": "Difference between CS and DMET",
								"payload": "GET_DMET_SEM_COURSES"
						  },
						  {
								"type": "postback",
								"title": "View courses for specific CS semesters",
								"payload": "GET_CS_SEM_COURSES"
						  },
						  {
								"type": "postback",
								"title": "View courses for specific DMET semesters",
								"payload": "GET_DMET_SEM_COURSES"
						  },
						  {
								"type": "postback",
								"title": "Get the prerequisites of a specific course",
								"payload": "GET_PREREQ"
						  }
					]
				},
				{
					"type": "postback",
					"title": "Get Started",
					"payload": "GET_STARTED"
				},
				{
					"type": "web_url",
					"title": "Search now",
					"url": "https://www.google.com/",
					"webview_height_ratio": "full"
				}
			]
		}
	]
  }'

  */

  /*

EMOJI NAMES 
***********

100, 1234, grinning, grimacing, grin, joy, rofl, partying, smiley, smile, sweat_smile, laughing, innocent, wink, blush, slightly_smiling_face, upside_down_face, 
relaxed, yum, relieved, heart_eyes, smiling_face_with_three_hearts, kissing_heart, kissing, kissing_smiling_eyes, kissing_closed_eyes, stuck_out_tongue_winking_eye, zany, raised_eyebrow, 
monocle, stuck_out_tongue_closed_eyes, stuck_out_tongue, money_mouth_face, nerd_face, sunglasses, star_struck, clown_face, cowboy_hat_face, hugs, smirk, no_mouth, neutral_face, 
expressionless, unamused, roll_eyes, thinking, lying_face, hand_over_mouth, shushing, symbols_over_mouth, exploding_head, flushed, disappointed, worried, angry, rage, pensive, 
confused, slightly_frowning_face, frowning_face, persevere, confounded, tired_face, weary, pleading, triumph, open_mouth, scream, fearful, cold_sweat, hushed, frowning, anguished, 
cry, disappointed_relieved, drooling_face, sleepy, sweat, hot, cold, sob, dizzy_face, astonished, zipper_mouth_face, nauseated_face, sneezing_face, vomiting, mask, face_with_thermometer, 
face_with_head_bandage, woozy, sleeping, zzz, poop, smiling_imp, imp, japanese_ogre, japanese_goblin, skull, ghost, alien, robot, smiley_cat, smile_cat, joy_cat, heart_eyes_cat, smirk_cat, 
kissing_cat, scream_cat, crying_cat_face, pouting_cat, palms_up, raised_hands, clap, wave, call_me_hand, +1, -1, facepunch, fist, fist_left, fist_right, v, ok_hand, raised_hand, 
raised_back_of_hand, open_hands, muscle, pray, foot, leg, handshake, point_up, point_up_2, point_down, point_left, point_right, fu, raised_hand_with_fingers_splayed, love_you, metal, 
crossed_fingers, vulcan_salute, writing_hand, selfie, nail_care, lips, tooth, tongue, ear, nose, eye, eyes, brain, bust_in_silhouette, busts_in_silhouette, speaking_head, baby, child, 
boy, girl, adult, man, woman, blonde_woman, blonde_man, bearded_person, older_adult, older_man, older_woman, man_with_gua_pi_mao, woman_with_headscarf, woman_with_turban, man_with_turban, 
policewoman, policeman, construction_worker_woman, construction_worker_man, guardswoman, guardsman, female_detective, male_detective, woman_health_worker, man_health_worker, woman_farmer, 
man_farmer, woman_cook, man_cook, woman_student, man_student, woman_singer, man_singer, woman_teacher, man_teacher, woman_factory_worker, man_factory_worker, woman_technologist, 
man_technologist, woman_office_worker, man_office_worker, woman_mechanic, man_mechanic, woman_scientist, man_scientist, woman_artist, man_artist, woman_firefighter, man_firefighter, 
woman_pilot, man_pilot, woman_astronaut, man_astronaut, woman_judge, man_judge, woman_superhero, man_superhero, woman_supervillain, man_supervillain, mrs_claus, santa, sorceress, wizard, 
woman_elf, man_elf, woman_vampire, man_vampire, woman_zombie, man_zombie, woman_genie, man_genie, mermaid, merman, woman_fairy, man_fairy, angel, pregnant_woman, breastfeeding, princess, 
prince, bride_with_veil, man_in_tuxedo, running_woman, running_man, walking_woman, walking_man, dancer, man_dancing, dancing_women, dancing_men, couple, two_men_holding_hands, 
two_women_holding_hands, bowing_woman, bowing_man, man_facepalming, woman_facepalming, woman_shrugging, man_shrugging, tipping_hand_woman, tipping_hand_man, no_good_woman, 
no_good_man, ok_woman, ok_man, raising_hand_woman, raising_hand_man, pouting_woman, pouting_man, frowning_woman, frowning_man, haircut_woman, haircut_man, massage_woman, massage_man, 
woman_in_steamy_room, man_in_steamy_room, couple_with_heart_woman_man, couple_with_heart_woman_woman, couple_with_heart_man_man, couplekiss_man_woman, couplekiss_woman_woman, 
couplekiss_man_man, family_man_woman_boy, family_man_woman_girl, family_man_woman_girl_boy, family_man_woman_boy_boy, family_man_woman_girl_girl, family_woman_woman_boy, 
family_woman_woman_girl, family_woman_woman_girl_boy, family_woman_woman_boy_boy, family_woman_woman_girl_girl, family_man_man_boy, family_man_man_girl, family_man_man_girl_boy, 
family_man_man_boy_boy, family_man_man_girl_girl, family_woman_boy, family_woman_girl, family_woman_girl_boy, family_woman_boy_boy, family_woman_girl_girl, family_man_boy, 
family_man_girl, family_man_girl_boy, family_man_boy_boy, family_man_girl_girl, yarn, thread, coat, labcoat, womans_clothes, tshirt, jeans, necktie, dress, bikini, kimono, lipstick, 
kiss, footprints, flat_shoe, high_heel, sandal, boot, mans_shoe, athletic_shoe, hiking_boot, socks, gloves, scarf, womans_hat, tophat, billed_hat, rescue_worker_helmet, mortar_board, 
crown, school_satchel, luggage, pouch, purse, handbag, briefcase, eyeglasses, dark_sunglasses, goggles, ring, closed_umbrella, dog, cat, mouse, hamster, rabbit, fox_face, bear, panda_face, 
koala, tiger, lion, cow, pig, pig_nose, frog, squid, octopus, shrimp, monkey_face, gorilla, see_no_evil, hear_no_evil, speak_no_evil, monkey, chicken, penguin, bird, baby_chick, 
hatching_chick, hatched_chick, duck, eagle, owl, bat, wolf, boar, horse, unicorn, honeybee, bug, butterfly, snail, beetle, ant, grasshopper, spider, scorpion, crab, snake, lizard, t-rex, 
sauropod, turtle, tropical_fish, fish, blowfish, dolphin, shark, whale, whale2, crocodile, leopard, zebra, tiger2, water_buffalo, ox, cow2, deer, dromedary_camel, camel, giraffe, 
elephant, rhinoceros, goat, ram, sheep, racehorse, pig2, rat, mouse2, rooster, turkey, dove, dog2, poodle, cat2, rabbit2, chipmunk, hedgehog, raccoon, llama, hippopotamus, kangaroo, 
badger, swan, peacock, parrot, lobster, mosquito, paw_prints, dragon, dragon_face, cactus, christmas_tree, evergreen_tree, deciduous_tree, palm_tree, seedling, herb, shamrock, 
four_leaf_clover, bamboo, tanabata_tree, leaves, fallen_leaf, maple_leaf, ear_of_rice, hibiscus, sunflower, rose, wilted_flower, tulip, blossom, cherry_blossom, bouquet, mushroom, 
chestnut, jack_o_lantern, shell, spider_web, earth_americas, earth_africa, earth_asia, full_moon, waning_gibbous_moon, last_quarter_moon, waning_crescent_moon, new_moon, 
waxing_crescent_moon, first_quarter_moon, waxing_gibbous_moon, new_moon_with_face, full_moon_with_face, first_quarter_moon_with_face, last_quarter_moon_with_face, sun_with_face, 
crescent_moon, star, star2, dizzy, sparkles, comet, sunny, sun_behind_small_cloud, partly_sunny, sun_behind_large_cloud, sun_behind_rain_cloud, cloud, cloud_with_rain, 
cloud_with_lightning_and_rain, cloud_with_lightning, zap, fire, boom, snowflake, cloud_with_snow, snowman, snowman_with_snow, wind_face, dash, tornado, fog, open_umbrella, umbrella, 
droplet, sweat_drops, ocean, green_apple, apple, pear, tangerine, lemon, banana, watermelon, grapes, strawberry, melon, cherries, peach, pineapple, coconut, kiwi_fruit, mango, avocado, 
broccoli, tomato, eggplant, cucumber, carrot, hot_pepper, potato, corn, leafy_greens, sweet_potato, peanuts, honey_pot, croissant, bread, baguette_bread, bagel, pretzel, cheese, egg, bacon, 
steak, pancakes, poultry_leg, meat_on_bone, bone, fried_shrimp, fried_egg, hamburger, fries, stuffed_flatbread, hotdog, pizza, sandwich, canned_food, spaghetti, taco, burrito, green_salad, 
shallow_pan_of_food, ramen, stew, fish_cake, fortune_cookie, sushi, bento, curry, rice_ball, rice, rice_cracker, oden, dango, shaved_ice, ice_cream, icecream, pie, cake, cupcake, 
moon_cake, birthday, custard, candy, lollipop, chocolate_bar, popcorn, dumpling, doughnut, cookie, milk_glass, beer, beers, clinking_glasses, wine_glass, tumbler_glass, cocktail, 
tropical_drink, champagne, sake, tea, cup_with_straw, coffee, baby_bottle, salt, spoon, fork_and_knife, plate_with_cutlery, bowl_with_spoon, takeout_box, chopsticks, soccer, basketball, 
football, baseball, softball, tennis, volleyball, rugby_football, flying_disc, 8ball, golf, golfing_woman, golfing_man, ping_pong, badminton, goal_net, ice_hockey, field_hockey, lacrosse, 
cricket, ski, skier, snowboarder, person_fencing, women_wrestling, men_wrestling, woman_cartwheeling, man_cartwheeling, woman_playing_handball, man_playing_handball, ice_skate, 
curling_stone, skateboard, sled, bow_and_arrow, fishing_pole_and_fish, boxing_glove, martial_arts_uniform, rowing_woman, rowing_man, climbing_woman, climbing_man, swimming_woman, 
swimming_man, woman_playing_water_polo, man_playing_water_polo, woman_in_lotus_position, man_in_lotus_position, surfing_woman, surfing_man, bath, basketball_woman, basketball_man, 
weight_lifting_woman, weight_lifting_man, biking_woman, biking_man, mountain_biking_woman, mountain_biking_man, horse_racing, business_suit_levitating, trophy, running_shirt_with_sash, 
medal_sports, medal_military, 1st_place_medal, 2nd_place_medal, 3rd_place_medal, reminder_ribbon, rosette, ticket, tickets, performing_arts, art, circus_tent, woman_juggling, man_juggling, 
microphone, headphones, musical_score, musical_keyboard, drum, saxophone, trumpet, guitar, violin, clapper, video_game, space_invader, dart, game_die, chess_pawn, slot_machine, jigsaw, 
bowling, red_car, taxi, blue_car, bus, trolleybus, racing_car, police_car, ambulance, fire_engine, minibus, truck, articulated_lorry, tractor, kick_scooter, motorcycle, bike, motor_scooter, 
rotating_light, oncoming_police_car, oncoming_bus, oncoming_automobile, oncoming_taxi, aerial_tramway, mountain_cableway, suspension_railway, railway_car, train, monorail, bullettrain_side, 
bullettrain_front, light_rail, mountain_railway, steam_locomotive, train2, metro, tram, station, flying_saucer, helicopter, small_airplane, airplane, flight_departure, flight_arrival, 
sailboat, motor_boat, speedboat, ferry, passenger_ship, rocket, artificial_satellite, seat, canoe, anchor, construction, fuelpump, busstop, vertical_traffic_light, traffic_light, 
checkered_flag, ship, ferris_wheel, roller_coaster, carousel_horse, building_construction, foggy, tokyo_tower, factory, fountain, rice_scene, mountain, mountain_snow, mount_fuji, 
volcano, japan, camping, tent, national_park, motorway, railway_track, sunrise, sunrise_over_mountains, desert, beach_umbrella, desert_island, city_sunrise, city_sunset, cityscape, 
night_with_stars, bridge_at_night, milky_way, stars, sparkler, fireworks, rainbow, houses, european_castle, japanese_castle, stadium, statue_of_liberty, house, house_with_garden, 
derelict_house, office, department_store, post_office, european_post_office, hospital, bank, hotel, convenience_store, school, love_hotel, wedding, classical_building, church, mosque, 
synagogue, kaaba, shinto_shrine, watch, iphone, calling, computer, keyboard, desktop_computer, printer, computer_mouse, trackball, joystick, clamp, minidisc, floppy_disk, cd, dvd, vhs, 
camera, camera_flash, video_camera, movie_camera, film_projector, film_strip, telephone_receiver, phone, pager, fax, tv, radio, studio_microphone, level_slider, control_knobs, compass, 
stopwatch, timer_clock, alarm_clock, mantelpiece_clock, hourglass_flowing_sand, hourglass, satellite, battery, electric_plug, bulb, flashlight, candle, fire_extinguisher, wastebasket, 
oil_drum, money_with_wings, dollar, yen, euro, pound, moneybag, credit_card, gem, balance_scale, toolbox, wrench, hammer, hammer_and_pick, hammer_and_wrench, pick, nut_and_bolt, gear, 
brick, chains, magnet, gun, bomb, firecracker, hocho, dagger, crossed_swords, shield, smoking, skull_and_crossbones, coffin, funeral_urn, amphora, crystal_ball, prayer_beads, nazar_amulet, 
barber, alembic, telescope, microscope, hole, pill, syringe, dna, microbe, petri_dish, test_tube, thermometer, broom, basket, toilet_paper, label, bookmark, toilet, shower, bathtub, soap, 
sponge, lotion_bottle, key, old_key, couch_and_lamp, sleeping_bed, bed, door, bellhop_bell, teddy_bear, framed_picture, world_map, parasol_on_ground, moyai, shopping, shopping_cart, balloon, 
flags, ribbon, gift, confetti_ball, tada, dolls, wind_chime, crossed_flags, izakaya_lantern, red_envelope, email, envelope_with_arrow, incoming_envelope, e-mail, love_letter, postbox, 
mailbox_closed, mailbox, mailbox_with_mail, mailbox_with_no_mail, package, postal_horn, inbox_tray, outbox_tray, scroll, page_with_curl, bookmark_tabs, receipt, bar_chart, 
chart_with_upwards_trend, chart_with_downwards_trend, page_facing_up, date, calendar, spiral_calendar, card_index, card_file_box, ballot_box, file_cabinet, clipboard, spiral_notepad, 
file_folder, open_file_folder, card_index_dividers, newspaper_roll, newspaper, notebook, closed_book, green_book, blue_book, orange_book, notebook_with_decorative_cover, ledger, books, 
open_book, safety_pin, link, paperclip, paperclips, scissors, triangular_ruler, straight_ruler, abacus, pushpin, round_pushpin, triangular_flag_on_post, white_flag, black_flag, rainbow_flag, 
closed_lock_with_key, lock, unlock, lock_with_ink_pen, pen, fountain_pen, black_nib, memo, pencil2, crayon, paintbrush, mag, mag_right, heart, orange_heart, yellow_heart, green_heart, 
blue_heart, purple_heart, black_heart, broken_heart, heavy_heart_exclamation, two_hearts, revolving_hearts, heartbeat, heartpulse, sparkling_heart, cupid, gift_heart, heart_decoration, 
peace_symbol, latin_cross, star_and_crescent, om, wheel_of_dharma, star_of_david, six_pointed_star, menorah, yin_yang, orthodox_cross, place_of_worship, ophiuchus, aries, taurus, gemini, 
cancer, leo, virgo, libra, scorpius, sagittarius, capricorn, aquarius, pisces, id, atom_symbol, u7a7a, u5272, radioactive, biohazard, mobile_phone_off, vibration_mode, u6709, u7121, u7533, 
u55b6, u6708, eight_pointed_black_star, vs, accept, white_flower, ideograph_advantage, secret, congratulations, u5408, u6e80, u7981, a, b, ab, cl, o2, sos, no_entry, name_badge, 
no_entry_sign, x, o, stop_sign, anger, hotsprings, no_pedestrians, do_not_litter, no_bicycles, non-potable_water, underage, no_mobile_phones, exclamation, grey_exclamation, question, 
grey_question, bangbang, interrobang, low_brightness, high_brightness, trident, fleur_de_lis, part_alternation_mark, warning, children_crossing, beginner, recycle, u6307, chart, sparkle, 
eight_spoked_asterisk, negative_squared_cross_mark, white_check_mark, diamond_shape_with_a_dot_inside, cyclone, loop, globe_with_meridians, m, atm, sa, passport_control, customs, 
baggage_claim, left_luggage, wheelchair, no_smoking, wc, parking, potable_water, mens, womens, baby_symbol, restroom, put_litter_in_its_place, cinema, signal_strength, koko, ng, ok, up, 
cool, new, free, zero, one, two, three, four, five, six, seven, eight, nine, keycap_ten, asterisk, eject_button, arrow_forward, pause_button, next_track_button, stop_button, record_button, 
play_or_pause_button, previous_track_button, fast_forward, rewind, twisted_rightwards_arrows, repeat, repeat_one, arrow_backward, arrow_up_small, arrow_down_small, arrow_double_up, 
arrow_double_down, arrow_right, arrow_left, arrow_up, arrow_down, arrow_upper_right, arrow_lower_right, arrow_lower_left, arrow_upper_left, arrow_up_down, left_right_arrow, 
arrows_counterclockwise, arrow_right_hook, leftwards_arrow_with_hook, arrow_heading_up, arrow_heading_down, hash, information_source, abc, abcd, capital_abcd, symbols, musical_note, 
notes, wavy_dash, curly_loop, heavy_check_mark, arrows_clockwise, heavy_plus_sign, heavy_minus_sign, heavy_division_sign, heavy_multiplication_x, infinity, heavy_dollar_sign, 
currency_exchange, copyright, registered, tm, end, back, on, top, soon, ballot_box_with_check, radio_button, white_circle, black_circle, red_circle, large_blue_circle, small_orange_diamond, 
small_blue_diamond, large_orange_diamond, large_blue_diamond, small_red_triangle, black_small_square, white_small_square, black_large_square, white_large_square, small_red_triangle_down, 
black_medium_square, white_medium_square, black_medium_small_square, white_medium_small_square, black_square_button, white_square_button, speaker, sound, loud_sound, mute, mega, loudspeaker, 
bell, no_bell, black_joker, mahjong, spades, clubs, hearts, diamonds, flower_playing_cards, thought_balloon, right_anger_bubble, speech_balloon, left_speech_bubble, clock1, clock2, clock3, 
clock4, clock5, clock6, clock7, clock8, clock9, clock10, clock11, clock12, clock130, clock230, clock330, clock430, clock530, clock630, clock730, clock830, clock930, clock1030, clock1130, 
clock1230, afghanistan, aland_islands, albania, algeria, american_samoa, andorra, angola, anguilla, antarctica, antigua_barbuda, argentina, armenia, aruba, australia, austria, azerbaijan, 
bahamas, bahrain, bangladesh, barbados, belarus, belgium, belize, benin, bermuda, bhutan, bolivia, caribbean_netherlands, bosnia_herzegovina, botswana, brazil, british_indian_ocean_territory, 
british_virgin_islands, brunei, bulgaria, burkina_faso, burundi, cape_verde, cambodia, cameroon, canada, canary_islands, cayman_islands, central_african_republic, chad, chile, cn, 
christmas_island, cocos_islands, colombia, comoros, congo_brazzaville, congo_kinshasa, cook_islands, costa_rica, croatia, cuba, curacao, cyprus, czech_republic, denmark, djibouti, 
dominica, dominican_republic, ecuador, egypt, el_salvador, equatorial_guinea, eritrea, estonia, ethiopia, eu, falkland_islands, faroe_islands, fiji, finland, fr, french_guiana, 
french_polynesia, french_southern_territories, gabon, gambia, georgia, de, ghana, gibraltar, greece, greenland, grenada, guadeloupe, guam, guatemala, guernsey, guinea, guinea_bissau, 
guyana, haiti, honduras, hong_kong, hungary, iceland, india, indonesia, iran, iraq, ireland, isle_of_man, israel, it, cote_divoire, jamaica, jp, jersey, jordan, kazakhstan, kenya, 
kiribati, kosovo, kuwait, kyrgyzstan, laos, latvia, lebanon, lesotho, liberia, libya, liechtenstein, lithuania, luxembourg, macau, macedonia, madagascar, malawi, malaysia, maldives, 
mali, malta, marshall_islands, martinique, mauritania, mauritius, mayotte, mexico, micronesia, moldova, monaco, mongolia, montenegro, montserrat, morocco, mozambique, myanmar, namibia, 
nauru, nepal, netherlands, new_caledonia, new_zealand, nicaragua, niger, nigeria, niue, norfolk_island, northern_mariana_islands, north_korea, norway, oman, pakistan, palau, 
palestinian_territories, panama, papua_new_guinea, paraguay, peru, philippines, pitcairn_islands, poland, portugal, puerto_rico, qatar, reunion, romania, ru, rwanda, st_barthelemy, 
st_helena, st_kitts_nevis, st_lucia, st_pierre_miquelon, st_vincent_grenadines, samoa, san_marino, sao_tome_principe, saudi_arabia, senegal, serbia, seychelles, sierra_leone, singapore, 
sint_maarten, slovakia, slovenia, solomon_islands, somalia, south_africa, south_georgia_south_sandwich_islands, kr, south_sudan, es, sri_lanka, sudan, suriname, swaziland, sweden, 
switzerland, syria, taiwan, tajikistan, tanzania, thailand, timor_leste, togo, tokelau, tonga, trinidad_tobago, tunisia, tr, turkmenistan, turks_caicos_islands, tuvalu, uganda, ukraine, 
united_arab_emirates, uk, england, scotland, wales, us, us_virgin_islands, uruguay, uzbekistan, vanuatu, vatican_city, venezuela, vietnam, wallis_futuna, western_sahara, yemen, zambia, 
zimbabwe, united_nations, pirate_flag

*/