//A command to allow players who have linked ther minecraft and discord accounts to view their and others' stats
/*Userstats page:*/ const statsLink = "https://scav-bot.glitch.me/userstats/";

var Command = require("../command");

module.exports = {
    commands: [
        new Command("userstats", {
            desc: "Command to view stats of linked players.",
            cooldown: 30,
            aliases: ["lb", "lbs", "leaderboards", "leaderboards", "playerstats"]
        }, (message) => {

            let thumb = "https://cdn.discordapp.com/attachments/728320173009797190/751494625298219057/scavlogo.png";
            message.channel.embed({
                title: "Player Statistics",
                thumbnail: thumb,
                fields: [
                    {
                        name: "Stats and Leaderboards",
                        value: `View the stats of players who have linked their minecraft and discord accounts, ordered by balance and more, [here](${statsLink}).`
                    },
                    {
                        name: "Joining the Board",
                        value: `To add yourself to this leaderboards page, link your account using the in-game command '/discord link'.`
                    },
                    {
                        name: "Updating the Stats",
                        value: `Your stats are automatically updated whenever you join the server, as well as when you first link your accounts.`
                    }
                ]
            });

        })
    ]
};