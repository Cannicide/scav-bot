//A non-command system to interpret messages that are not commands and auto-respond/auto-react if necessary

//var report = require("./commands/report");
var sibyll = require("./sibyll/sibyll");
var evg = require("./evg");
var polls = require("./commands/poll");

function Interpreter(message) {

    var Reactions = new evg("reactions");

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

            input = input.replace(/\@everyone/gi, "[@]everyone").replace(/\@here/gi, "[@]here");

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

    this.interpretReaction = (reaction, user, isAdding) => {

        if (user.bot) return;

        var message = reaction.message;
        var emote = reaction.emoji.name;
        var emoteID = reaction.emoji.id;

        var cache = Reactions.get();
        var inCache = cache.find(entry => (entry.name == emote || entry.id == emoteID || (Array.isArray(entry.name) && entry.name.includes(emote)) || (Array.isArray(entry.id) && entry.id.includes(emoteID))) && entry.messageID == message.id);

        //The given message is not to be interpreted by the interpreter if not stored as such
        if (!inCache) return;

        //Check the purpose of the interpreter, i.e. if it is a poll
        if (inCache.type == "poll") {
            //Vote on poll
            
            //Check whether we are removing or adding the reaction
            if (isAdding) {
                polls.votes.add(reaction, user);
            }
            else {
                polls.votes.retract(reaction, user);
            }

        }
        else if (inCache.type == "poll-end") {
            //End poll
            
            //If we are adding the trash reaction, end the poll
            if (isAdding) {
                polls.polls.endByReaction(reaction, user);
            }

        }

    }

    this.fetchReactionInterpreters = (client) => {
        var cache = Reactions.get();

        cache.forEach(entry => {
            //Fetch and cache all messages that need their reactions interpreted
            client.channels.fetch(entry.channelID).then(channel => {
                channel.messages.fetch(entry.messageID, true);
            });
        });
        
    }

}

module.exports = Interpreter;