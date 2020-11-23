//Clears an entire channel by cloning and deleting it.

var Command = require("../command");
var Embed = require("../interface").Embed;

module.exports = new Command("clearchannel", (message, args) => {

    if (args) return message.channel.send("Warning: you must use this command in the channel which you choose to clear.");

    //Clear channel, clone it, and set its position to the same position
    var pos = message.channel.position;
    var name = message.channel.name;

    if (name == "dyno-reports") return message.reply("you cannot clear the dyno-reports channel.");
    if (name.toLowerCase().match("suggestions")) return message.reply("you must use `/clearsuggestions` to clear a suggestions channel.");

    message.channel.clone().then(c => {
        c.setPosition(pos).catch(err => console.log(err));
    }).catch(err => console.error(err));

    //Delete channel and log the channel clearing in the logs channel
    message.channel.delete(`Cleared ${name} channel.`).then(m => {
        var logs = message.guild.channels.cache.find(c => c.name == "dyno-reports");
        var embed = new Embed(message, message.guild.iconURL(), [], `**${name} channel was cleared.**`);

        if (logs) logs.send(embed); 
    });

}, {
    roles: ["Head Mod", "Admin", "System Administrator", "Head Admin", "Owner"]
}, false, "Clears the channel in which the command is used.");