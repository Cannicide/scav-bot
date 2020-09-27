//A non-command system to interpret messages that are not commands and auto-respond/auto-react if necessary

//var report = require("./commands/report");
var sibyll = require("./sibyll/sibyll");

function Interpreter(message) {

    this.interpret = (args) => {

        //Suggestion reactions:
        if (args[0].toLowerCase().match("suggestion:") && message.channel.name.toLowerCase().match("suggestions")) {
            
            message.react("713053971757006950");

            //Send nay after yea
            setTimeout(() => {
                message.react("713053971211878452");
            }, 100);
            
        }
        //Sibyll mention response:
        else if (message.mentions.members.first() && message.mentions.members.first().id == "751503579457519656") {
            var input = message.content.substring(message.content.indexOf(" ") + 1);

            if (input == "" || input == " " || !input || input.startsWith("<@")) return;

            sibyll.respond(input).then((output) => {

                message.channel.send(output);

            });

        }
        
        /*
        //Bug Colon system:
        else if (args[0].toLowerCase().match("bug:") && message.channel.name.toLowerCase().match("bug")) {
            report.colon(message, args, "Bugs");
        }
        //Safespot Colon system:
        else if (args[0].toLowerCase().match("safespot:") && message.channel.name.toLowerCase().match("safespot")) {
            report.colon(message, args, "Safespots");
        }*/

    }

    this.interpretDM = (args, client) => {

        var DiscordSRZ = require("./discordsrz");

        //DiscordSRZ Code Link:
        if (args[0].length == 5 && args[0].match(/[0-9]{5}/g)) {
            var srz = new DiscordSRZ(client);
            new srz.Link(args[0], message);
        }

    }

}

module.exports = Interpreter;