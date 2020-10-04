//A command to allow players who have linked ther minecraft and discord accounts to view their and others' stats
/*Userstats page:*/ const statsLink = "https://scav-bot.glitch.me/userstats/";

var Command = require("../command");
var Interface = require("../interface");

module.exports = {
    commands: [
        new Command("userstats", (message, args) => {

            let thumb = "https://cdn.discordapp.com/attachments/728320173009797190/751494625298219057/scavlogo.png";
            var embed = new Interface.Embed(message, thumb, [
                {
                    name: "Player Stats and Leaderboards",
                    value: `You can view the stats of players who have linked their minecraft and discord accounts, ordered by balance and more, [here](${statsLink}). To add yourself to this leaderboards page, link your account using the in-game command '/discord link'.`
                }
            ]);

            embed.embed.title = "Ban Appeals";

            message.channel.send(embed);

        }, false, false, "Command to view stats of linked players."),
        new Alias("stats", "userstats"),
        new Alias("lb", "userstats"),
        new Alias("lbs", "userstats"),
        new Alias("leaderboards", "userstats"),
        new Alias("leaderboard", "userstats")
    ]
};