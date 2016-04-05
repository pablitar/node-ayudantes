var serverUrl = "http://" + process.argv[2];
var username = process.argv[3];
var role = process.argv[4];
var loremIpsum = require('lorem-ipsum');

var request = require('request');

function log(tag, onSuccess) {
    return function (err, resp, body) {
        if (err || resp.statusCode != 200) {
            console.log("Error en " + tag + ": " + JSON.stringify(err, null, 2) + "\n------------------------\n" + JSON.stringify(resp, null, 2));
        } else {
            console.log("Respuesta a " + tag + ": " + JSON.stringify(body, null, 2));
            if(onSuccess) {
                onSuccess(resp, body);
            }
        }
    };
}

function generateMessage()  {
    return {
        content: loremIpsum(), user: username
    };
}

var sendQuestion = function() {
    var question = generateMessage();

    request.post(serverUrl + '/student/question', {body: question, json:true}, log("PREGUNTA"));
};

function sendResponseTo(aNotification) {
    var questionId = aNotification.data.id;

    var response = generateMessage();

    request.post(serverUrl + '/professor/respond/' + questionId, {body: response, json:true}, log("RESPUESTA"))
};

function sendResponseToAny(someNotifications) {
    if(!someNotifications.length == 0) {
        var index = parseInt(Math.random() * (someNotifications.length - 1));
        sendResponseTo(someNotifications[index])
    }
}

var notifications = function() {
    request.get(serverUrl + '/user/' + username + '/notifications',{json: true}, log("NOTIFICATIONS", roles[role].notificationsHandler));
};

var roles = {
    student: {
        start : function() {
            setInterval(sendQuestion, 5000);
            setInterval(notifications, 7500);
        }
    },
    professor: {
        start: function() {
            setInterval(notifications, 2000);
        },
        notificationsHandler: function(resp, body){
            sendResponseToAny(body.notifications.filter(function(aNotification){
                return aNotification.kind == "newQuestion";
            }));
        }
    }
};

request.post(serverUrl + '/user/register',
    {body:{username: username, kind: 'student'}, json: true},
    log("REGISTRAR", function(){
        roles[role].start();
    })
);





