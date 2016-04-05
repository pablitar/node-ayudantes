var express = require('express');
var bodyParser = require('body-parser');

var port = process.argv[2] ? process.argv[2] : 3000;

var app = express();
app.use(bodyParser.json());

var idProvider = {
    currentId: 1,
    nextId: function() {
        var id = this.currentId;
        this.currentId++;
        return id;
    }
};

var messages = {
    messages: [],
    add : function(aMessage) {
        return this.messages.push(aMessage);
    },

    find: function(anId) {
        return this.messages.find(function(aMessage){
            return aMessage.id == anId;
        });
    }
};
var users = {
    users: [],

    add : function(aUser) {
        this.users.push(aUser);
    },

    all : function () {
        return this.users.slice();
    },

    allBut : function(aUser) {
        return this.all().filter(function(userObject){
            return userObject.username != aUser;
        });
    },

    find : function(username) {
        return this.all().find(function(aUser){
            return aUser.username == username;
        });
    }
};

app.post('/user/register', function (req, res) {
    var username = req.body.username;
    var kind = req.body.kind;

    users.add({
        username: username,
        kind: kind,
        notifications: []
    });

    res.json({status: "OK"});
});

function addMessage(content, user, kind) {
    var id = idProvider.nextId();

    var question = {content: content, user: user, id: id};

    messages.add(question);

    users.allBut(user).forEach(function (each) {
        each.notifications.push({kind: kind, data: question});
    });

    return question;
}
app.post('/student/question', function(req, res) {
    var content = req.body.content;
    var user = req.body.user;
    console.log("QUESTION REQUEST: " + JSON.stringify(req.body));
    var question = addMessage(content, user, "newQuestion");
    console.log("ADDING QUESTION: " + JSON.stringify(question, null, 2));
    res.json(question);
});

app.post('/professor/respond/:id', function(req, res) {
    var question = messages.find(req.params.id);
    if(question) {
        var message = addMessage(req.body.content, req.body.user, "response");
        message.question = question;
        res.json(message);
    } else {
        res.send(404);
    }
});

app.get('/user/:username/notifications', function(req, res) {
    var username = req.params.username;

    var user = users.find(username);

    if(user) {
        res.json({notifications: user.notifications});
        user.notifications = [];
    } else {
        res.send(404);
    }
});

app.listen(port, function () {
    console.log('Example app listening on port 3000!');
});