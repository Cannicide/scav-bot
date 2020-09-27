var natural = require('natural');
var wildcard = require('wildcard-named');
const fetch = require("node-fetch");

var actions = {};
var actionMap = {};
var customs = [];
var fetchMap = {};

function stripPunctuation(str) {
    return str.toLowerCase().replace(/[ !"`'.*+?^${}()|[\]\\]/g, "").replace(/sibyll/g, "");
}

function stripKeepSpaces(str) {
    return str.replace(/[!"`'*.+?^${}()|\\]/g, "");
}

function Action(name) {

    this.name = name;

    var responses = [];
    var inputs = [];

    this.add = (res) => {
        responses.push(res);
    }

    this.addInput = (input) => {
        inputs.push(input);
    }

    this.getInputs = () => {
        return inputs;
    }

    this.getResponses = () => {
        return responses;
    }

    this.randomResponse = () => {
        var rand = Math.floor(Math.random() * responses.length);
        return responses[rand];
    }

    actions[name] = this;

}

function FalseAction(response) {

    this.randomResponse = () => {
        return response;
    }

    this.isFetch = false;

}


function Trainer() {
    var classifier = new natural.BayesClassifier();
    this.unknown = new Action("unknown");
    var variables = new Variables();

    this.train = (str, action) => {
        if (!action instanceof Action) throw new Error('Variable "action" must be of type Action.');

        classifier.addDocument(str, action.name);
        classifier.train();

        actionMap[stripPunctuation(str)] = action;
    }

    this.respond = (str) => {
        var action = this.getAction(str);
        
        return new Promise((resolve, reject) => {
            if (action.isFetch) {
                fetch(action.isFetch).then(res => res.text())
                .then(body => {
                    variables.set("response", body);
                    resolve(variables.parseDefaults(action.randomResponse()));
                });
            }
            else {
                resolve(variables.parseDefaults(action.randomResponse()));
            }
        });
    }

    this.addCustom = (action) => {
        customs.push(action);
    };

    this.addFetch = (action, fetcher) => {
        fetchMap[action.name] = fetcher;
    }

    this.getAction = (str) => {

        var literalMatch = false;
        var customMatch = false;

        if (stripPunctuation(str) in actionMap) literalMatch = actionMap[stripPunctuation(str)].name;

        customs.forEach((action) => {
            if (literalMatch || customMatch) return;

            if (action.name == "choice:is-x-a-y") {
                action.getInputs().forEach(input => {
                    if (literalMatch || customMatch) return;

                    var wildInput = stripKeepSpaces(input.replace(/\{a\}/g, "[all:a]").replace(/\{b\}/g, "[all:b]")).toLowerCase();
                    var stripped = stripKeepSpaces(str);

                    var output = wildcard(stripped.toLowerCase(), wildInput);

                    if (output) {
                        //Is this input

                        if (input.match("\{a} like \{b}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = output.b;

                            variables.set("a", a.substring(0, 1).toUpperCase() + a.substring(1));
                            variables.set("b", b);

                            var responses = action.getResponses()[1];
                            var rand = Math.floor(Math.random() * responses.length);
                            customMatch = new FalseAction(responses[rand]);
                        }
                        else if (input.match("\{a} not \{b}")) {
                            //Is the "not" comparison
                            var a = output.a;
                            var b = output.b;

                            variables.set("a", a.substring(0, 1).toUpperCase() + a.substring(1));
                            variables.set("b", b);

                            var responses = action.getResponses()[2];
                            var rand = Math.floor(Math.random() * responses.length);
                            customMatch = new FalseAction(responses[rand]);
                        }
                        else {
                            //Is the "a" comparison
                            var a = output.a;
                            var b = output.b;

                            variables.set("a", a.substring(0, 1).toUpperCase() + a.substring(1));
                            variables.set("b", b);

                            var responses = action.getResponses()[0];
                            var rand = Math.floor(Math.random() * responses.length);
                            customMatch = new FalseAction(responses[rand]);

                        }
                    }
                });
            }
            else if (action.name == "choice:are-x-y") {
                action.getInputs().forEach(input => {
                    if (literalMatch || customMatch) return;

                    var wildInput = stripKeepSpaces(input.replace(/\{a\}/g, "[all:a]").replace(/\{b\}/g, "[all:b]")).toLowerCase();
                    var stripped = stripKeepSpaces(str);

                    var output = wildcard(stripped.toLowerCase(), wildInput);

                    if (output) {
                        //Is this input

                        if (input.match("I \{a}")) {
                            //Is the "am I" comparison
                            var a = output.a;

                            variables.set("a", a);

                            var responses = action.getResponses()[0];
                            var rand = Math.floor(Math.random() * responses.length);
                            customMatch = new FalseAction(responses[rand]);
                        }
                        else {
                            //Is the "are you" comparison
                            //var b = stripped.split(/are you /gi, 2)[1];
                            var b = output.b;

                            variables.set("b", b);

                            var responses = action.getResponses()[1];
                            var rand = Math.floor(Math.random() * responses.length);
                            customMatch = new FalseAction(responses[rand]);
                        }
                    }
                });
            }
            else if (action.name == "choice:should-x-do-y") {
                action.getInputs().forEach(input => {
                    if (literalMatch || customMatch) return;

                    var wildInput = stripKeepSpaces(input.replace(/\{a\}/g, "[all:a]")).toLowerCase();
                    var stripped = stripKeepSpaces(str);

                    var output = wildcard(stripped.toLowerCase(), wildInput);

                    if (output) {
                        //Is this input

                        if (input.match("should I \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "you";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                        else if (input.match("should he \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "he";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                        else if (input.match("should she \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "she";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                        else if (input.match("should they \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "they";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                        else if (input.match("should you \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "I";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                        else if (input.match("should we \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "we";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                        else if (input.match("should y'all \{a}")) {
                            //Is the "like" comparison
                            var a = output.a;
                            var b = "y'all";

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);
                        }
                    }
                });
            }
            else if (action.name == "choice:choose-between") {
                action.getInputs().forEach(input => {
                    if (literalMatch || customMatch) return;

                    var wildInput = stripKeepSpaces(input.replace(/\{a\}/g, "[all:a]").replace(/\{b\}/g, "[all:b]")).toLowerCase();
                    var stripped = stripKeepSpaces(str);

                    var output = wildcard(stripped.toLowerCase(), wildInput);

                    if (output) {
                        //Is this input

                            if (input.startsWith("\{a}") && stripped.toLowerCase().startsWith("choose")) return;

                            var a = output.a;
                            var b = output.b;

                            variables.set("a", a);
                            variables.set("b", b);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);

                    }
                });
            }
            else if (action.name == "choice:will-you-x-me" || action.name == "choice:will-you-be-my-x") {
                action.getInputs().forEach(input => {
                    if (literalMatch || customMatch) return;

                    var wildInput = stripKeepSpaces(input.replace(/\{a\}/g, "[all:a]")).toLowerCase();
                    var stripped = stripKeepSpaces(str);

                    var output = wildcard(stripped.toLowerCase(), wildInput);

                    if (output) {
                        //Is this input

                            var a = output.a;
                            var prep = input.split(" ", 2)[0];

                            variables.set("a", a);
                            variables.set("prep", prep);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);

                    }
                });
            }
            else if (action.name == "choice:will-x-be-y") {
                action.getInputs().forEach(input => {
                    if (literalMatch || customMatch) return;

                    var wildInput = stripKeepSpaces(input.replace(/\{a\}/g, "[all:a]").replace(/\{b\}/g, "[all:b]")).toLowerCase();
                    var stripped = stripKeepSpaces(str);

                    var output = wildcard(stripped.toLowerCase(), wildInput);

                    if (output) {
                        //Is this input

                            var a = output.a;
                            var b = output.b;
                            var inter = input.split("} ", 2)[1].split(" {", 2)[0];

                            if (b == "i") b = "you";
                            if (b == "you" || b == "u") b = "I";

                            variables.set("a", a);
                            variables.set("b", b);
                            variables.set("inter", inter);

                            var responses = action.randomResponse();
                            customMatch = new FalseAction(responses);

                    }
                });
            }
            else {
                if (action.name in fetchMap) {
                    //Fetch data using substituted variables
                    var fetcher = fetchMap[action.name];

                    action.getInputs().forEach(input => {
                        if (literalMatch || customMatch) return;

                        var wildInput = stripKeepSpaces(input.replace(/\{([a-zA-Z]+)}/g, "[all:$1]")).toLowerCase();
                        var stripped = stripKeepSpaces(str);

                        var output = wildcard(stripped.toLowerCase(), wildInput);

                        if (output) {
                            //Is an input

                                Object.keys(output).forEach(key => {
                                    //Format spaces
                                    output[key] = output[key].replace(/ /g, "+");
                                    variables.set(key, output[key]);
                                });

                                var responses = action.randomResponse();

                                if (typeof responses == "object") responses = responses[Math.floor(Math.random() * responses.length)];

                                fetcher = new Variables(output).parse(fetcher);

                                customMatch = new FalseAction(responses);
                                customMatch.isFetch = fetcher;

                        }
                    });
                }
                else {
                    // Simply substitute variables from input to output
                    action.getInputs().forEach(input => {
                        if (literalMatch || customMatch) return;

                        var wildInput = stripKeepSpaces(input.replace(/\{([a-zA-Z]+)}/g, "[all:$1]")).toLowerCase();
                        var stripped = stripKeepSpaces(str);

                        var output = wildcard(stripped.toLowerCase(), wildInput);

                        if (output) {
                            //Is an input

                                Object.keys(output).forEach(key => {
                                    variables.set(key, output[key]);
                                });

                                var responses = action.randomResponse();

                                if (typeof responses == "object") responses = responses[Math.floor(Math.random() * responses.length)];

                                customMatch = new FalseAction(responses);

                        }
                    });
                }
            }
        })

        var name = literalMatch ? literalMatch : classifier.classify(str);

        return customMatch ? customMatch : (name && name in actions ? actions[name] : actions["unknown"]);
    }
}

function Variables(obj) {

    var defVars = {
        time: "",
        timechunk: "",
        name: ""
    };

    this.parse = (str) => {
        for (var item in obj) {
            var reg = new RegExp("{" + item + "}", "gi");
            str = str.replace(reg, obj[item]);
        }

        return str;
    }

    this.set = (key, value) => {
        defVars[key] = value;
    }

    this.parseDefaults = (str) => {
        var fulldate = new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York'
        });
        
        let parts = fulldate.split(", ");
        var fulltime = parts[1];

        var time = {
            raw: fulltime.split(" ")[0],
            ampm: fulltime.split(" ")[1]
        }
        time.hours = Number(time.raw.split(":")[0]);
        time.mins = Number(time.raw.split(":")[1]);
        time.secs = time.raw.split(":")[2];

        var hours = time.hours;

        if (time.ampm == "PM" && time.hours != 12) {
            hours += 12;
        }
        else if (time.ampm == "AM" && time.hours == 12) {
            hours = 0;
        }

        if (hours < 12) {
            defVars.timechunk = "morning";
        }
        else if (hours >= 12 && hours < 5) {
            defVars.timechunk = "afternoon";
        }
        else if (hours >= 5 && hours < 9) {
            defVars.timechunk = "evening";
        }
        else {
            defVars.timechunk = "night";
        }

        if (("" + time.mins).length == 1) time.mins = "0" + time.mins;

        defVars.time = time.hours + ":" + time.mins + " " + time.ampm + " EST";

        return new Variables(defVars).parse(str);
    }

}

module.exports = {
    Action: Action,
    Trainer: Trainer,
    Variables: Variables
}