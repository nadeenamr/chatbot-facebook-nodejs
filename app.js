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

function getHistory(sender){
	return "FUNCTION WORKS and this is sender : "+sender;
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
	switch (action) {
		case "myFirstMidterm":
			students.getStudentTranscript(function(studentIDAndTranscript){
				prolog.getStudentNextSchedule(function(allCourses){
					let courseList = allCourses.toUpperCase().split(", ");
					courses.getFirstMidtermInfo(function(firstCodeDate){
						courses.getCourseName(function(courseName){
							let reply = `Lets see here... your first midterm is ${firstCodeDate[0]}: ${courseName} and so far it's expected to be on ${firstCodeDate[1]} (although keep an eye out for any adjustments given the current "situation") `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/25EAreLnZIFWasblJe/giphy.gif",sender);
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
							let reply = `Lets see here... your last midterm is ${lastCodeDate[0]}: ${courseName} and so far it's expected to be on ${lastCodeDate[1]} (although keep an eye out for any adjustments given the current "situation") `;
							sendTextMessage(sender,reply);
							sendGifMessage("https://media.giphy.com/media/3o84UdRSymVQCrZT6E/giphy.gif",sender);
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
							let reply = `Lets see here... your first final is ${firstCodeDate[0]}: ${courseName} and so far it's expected to be on ${firstCodeDate[1]} (although keep an eye out for any adjustments given the current "situation") `;
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
							let reply = `Lets see here... your last final is ${finalCodeDate[0]}: ${courseName} and so far it's expected to be on ${finalCodeDate[1]} (although keep an eye out for any adjustments given the current "situation") `;
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
					const wink = emoji.get('wink');
					let reply = `Here's a smooth schedule that I wiped up just for you `+wink+`\nCourses: ${allCourses}.\nWhat do you think?`;
					sendTextMessage(sender, reply);
					sendGifMessage("https://media.giphy.com/media/g0NZy8CjNDQ2K2DnG5/giphy.gif", sender);
				}, studentIDAndTranscript);
			}, sender);
			break;
		case "welcomeUser":
				students.newOrRegularStudent(function(isRegular){
					let reply;
					if(isRegular[0]=="new"){
						reply = "Welcome "+ isRegular[1] +"! "+emoji.get('Waving Hand')+" I'm your MET Mentor! I can answer any questions you might have and offer support/advice for MET students. Please enter your GUC ID so I am able to access your records."; 
						sendTextMessage(sender, reply);
						sendGifMessage("https://giphy.com/gifs/cbc-schittscreek-schitts-creek-88iGfhImcQ7mkbyuiS",sender);
					}else{
						if(isRegular[0]=="old"){
							reply = "Welcome back "+ isRegular[1] +" "+emoji.get('Waving Hand')+" ! How can I help you today? "+emoji.get('Woman Office Worker');
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
				sendTextMessage(sender, "Amazing! I also need is your GUC username");
			}
			break;
		case "takingStudentUsername":
			if(isDefined(contexts[0])&&contexts[0].parameters['studentUsername']){
				students.saveStudentUsername(contexts[0].parameters['studentUsername'], sender);
				sendTextMessage(sender, "Perfect "+emoji.get('Ok Hand')+" I have everything I need. Tell me, how can I be of service to you?");
			}
			break;
		case "course_prereq": 
			courses.readCoursePrereqs(function(codes){
				if(codes==""){
					sendTextMessage(sender, "This course has no prerequisites.");
				}else{
					let allCoursesString = codes.join(", ");
					let reply = `Prerequisite courses' code(s) are: ${allCoursesString}.`;
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
		case "GET_DMET_SEM_COURSES": 
				sendToApiAi(senderID, "dmet semester courses");
			break;
		case "GET_CS_SEM_COURSES": 
				sendToApiAi(senderID, "cs semester courses");
			break;
		case "GET_CS_DMET_DIFF":
				sendToApiAi(senderID, "What is the difference between CS and DMET?");
			break;
		case "GET_PREREQ": 
				sendGifMessage("https://media.giphy.com/media/F6PFPjc3K0CPe/giphy.gif", senderID);
			break;
		case "GET_INFO": 
			
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