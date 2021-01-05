//Meme command to add salt above a user's profile.

/* Temporarily disabled due to non-functional API
var Command = require("../command");
var Alias = require("../alias");

module.exports = {
    commands: [
        new Command("salty", (message, args) => {

            var url = `https://cannicideapi.glitch.me/memes/salty?image=`;

            if (args.length >= 1 && args[0]) {
                var name = args.join(" ");

                var user = message.guild.members.cache.find(m => m.user.tag == name);

                if (!user) {
                    message.channel.send("Could not find a user with the tag: " + name);
                }
                else {
                    url += user.user.displayAvatarURL();

                    message.channel.send({files: [{
                        attachment: url,
                        name: `${user.user.username}-salty.png`
                    }]});
                }

            }
            else {

                url += message.author.displayAvatarURL();

                message.channel.send({files: [{
                    attachment: url,
                    name: `${message.author.username}-salty.png`
                }]});

            }

        }, false, false, "Meme command to add salt above a salty user's profile.").attachArguments([
            {
                name: "usertag#1234",
                optional: true
            }
        ]),

        new Alias("salt", "salty")
    ]
}
*/