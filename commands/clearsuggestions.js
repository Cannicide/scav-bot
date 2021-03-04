//Command to automatically clear and clone suggestions channels, and post all suggestions with more yeas than nays to the trello
var Command = require("../command");
var Trello = require('trello-node-api')(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
var Embed = require("../interface").Embed;

const labels = [
    "60413aba184d2c731ba52187", //Unanimous label
    "60413aba184d2c731ba52188", //Very Popular,
    "60413aba184d2c731ba5218c", //Somewhat Popular
    "6041545236d17c8666683e0f", //Barely Popular
    "60413aba184d2c731ba5218d" //50/50 Split
].reverse();

function labelFromPopularity(percent) {
    var chunk = (percent - 50) * (labels.length - 1) / 50;
    var output = 0;

    if (chunk == 4) output = 4;
    else if (chunk > 3) output = 3;
    else if (chunk > 1) output = 2;
    else if (chunk > 0) output = 1;

    return (labels[output]);
}

module.exports = new Command("clearsuggestions", {
    roles: ["Head Mod", "Admin", "System Administrator", "Head Admin", "Owner"],
    desc: "Clears the suggestions channels and automatically posts popular suggestions to our trello.",
    aliases: ["cls", "clsuggestions"]
}, (message) => {

    //Check if channel is a suggestions channel
    if (!message.channel.name.toLowerCase().match("suggestions")) return message.channel.send("You must be in a suggestions channel to use this command!");

    //Get messages in channel
    message.channel.messages.fetch().then((messages) => {
        var collected = messages.filter(m => m.content.toLowerCase().startsWith("suggestion:"));

        messages = collected.array();
        var suggestions = [];

        //Collect number of yea/nay votes on each suggestion
        messages.forEach(message => {
            var yeas = message.reactions.cache.get("713053971757006950");
            var nays = message.reactions.cache.get("713053971211878452");

            if (!yeas || !nays || yeas.count < nays.count) return;

            var suggestion = {
                yeas: yeas.count - 1,
                nays: nays.count - 1,
                desc: "",
                author: ""
            }
            
            suggestion.desc = message.content.substring(12);
            suggestion.author = message.author.tag;

            suggestions.push(suggestion);
        });

        //Sort from most to least yea votes
        suggestions = suggestions.sort((a, b) => b.yeas - a.yeas);
      
        var list = process.env.SUGGESTION_LIST;
      
        if (message.channel.name.toLowerCase().match("staff")) list = process.env.STAFF_SUGGESTION_LIST;

        //Create trello cards for each suggestion
        async function createCards() {

            for (var suggestion of suggestions) {

                var vote_total = suggestion.yeas + suggestion.nays;
                var yeas_percent = Math.round(suggestion.yeas / vote_total * 100);
                // var nays_percent = Math.round(suggestion.nays / vote_total * 100);

                var label = labelFromPopularity(yeas_percent);

                var data = {
                    name: `${suggestion.desc}`,
                    desc: `${suggestion.yeas} Yea / ${suggestion.nays} Nay \n (${suggestion.author}) \n\n[Added by Scavenger]`,
                    pos: 'bottom',
                    idList: list, //REQUIRED
                    due: null,
                    dueComplete: false,
                    idMembers: [],
                    idLabels: [label],
                    urlSource: null
                };

                await Trello.card.create(data);
            }

        };

        createCards();

        //Clear channel, clone it, and set its position to the same position
        var pos = message.channel.position;

        message.channel.clone().then(c => {
            c.setPosition(pos).catch(err => console.log(err));
            c.send("Create a suggestion by typing the prefix \"suggestion:\" followed by your suggestion. All spam and flooding will be deleted.").then(m => {
                m.pin({reason: "Important; automatic clearing/cloning process."});
            });
        }).catch(err => console.error(err));

        //Delete channel and log the channel clearing in the logs channel
        message.channel.delete("Cleared and cloned suggestions channel.").then(m => {
            var logs = message.guild.channels.cache.find(c => c.name.match("scavenger-logs"));
            var embed = new Embed(message, {
                thumbnail: message.guild.iconURL(), 
                desc: `**Suggestions channel was cleared and cloned.**\nBy: **\`${message.author.tag}\`**\nAll suggestions with 50% or more YEAs have been added to the trello.`
            });

            if (logs) logs.send(embed); 
        });

    })

});