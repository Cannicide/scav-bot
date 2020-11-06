//A command to allow players to appeal their bans, showing them the proper way of doing so
/*Ban appeal creation:*/ const banThread = "https://scavengercraft.net/forums/ban-appeals.17/create-thread?title=_%27s+Ban+Appeal"
/*Ban appeal format:*/ const banFormat = "https://scavengercraft.net/threads/ban-appeal-format.1000/";

var Command = require("../command");
var Interface = require("../interface");

module.exports = new Command("banappeal", (message, args) => {

    let thumb = "https://cdn.discordapp.com/attachments/728320173009797190/751494625298219057/scavlogo.png";
    var embed = new Interface.Embed(message, thumb, [
        {
            name: "The Ban Appeal Format",
            value: `So you have been banned from the server. To appeal your ban, you must create a ban appeal on the Scav Forums, following the appropriate format. The ban appeal format can be found [here](${banFormat}).`
        },
        {
            name: "Properly Appealing",
            value: `Copy the template provided in the ban appeal format. Create a new appeal thread [here](${banThread}) and paste the template. Provide detailed and professional responses to the prompts provided in the template. Afterwards, wait patiently until staff reviews your appeal.`
        }
    ]);

    embed.embed.title = "Ban Appeals";

    message.channel.send(embed);

}, false, false, "Command to create a ban appeal.");