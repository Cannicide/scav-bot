//Meme command to add a filter to a user's profile, such as grayscale or sepia.

var Command = require("../command");
var Alias = require("../alias");

module.exports = {
    commands: [
        new Command("filter", (message, args) => {

            var url = `https://cannicideapi.glitch.me/filter/`;
            var filters = [
                "blackandwhite",
                "b&w",
                "black",
                "white",
                "grayscale",
                "blurred",
                "blur",
                "blurry",
                "inverse",
                "invert",
                "inverted",
                "deepfried",
                "deepfry",
                "deepfryer",
                "gold",
                "sepia",
                "pixels",
                "pixelate",
                "pixel",
                "pixelated",
                "halloween",
                "halloweeninverted",
                "halloween-inverted",
                "halloweninverse",
                "halloween-inverse",
                "halloweeninvert",
                "halloween-invert"
            ];

            if (args.length > 1 && args[0]) {
                var name = args.slice(0, args.length - 1).join(" ");
                var filter = args[args.length - 1].toLowerCase();

                if (!filters.includes(filter)) return message.channel.send("Please specify a valid filter.\nFilters include: Grayscale, Blur, Inverted, Deepfried, Sepia, Pixelated, Halloween, and HalloweenInverted.");
                if (filter.startsWith("halloween")) url = `https://cannicideapi.glitch.me/memes/`;

                var user = message.guild.members.find(m => m.user.tag == name);

                if (!user) {
                    message.channel.send("Could not find a user with the tag: " + name);
                }
                else {
                    url += `${filter.match("invert") && filter.match("halloween") ? "halloween" : filter}?image=${user.user.displayAvatarURL}`;

                    if (filter.match("invert") && filter.match("halloween")) url += `&inverse=true`;

                    message.channel.send({files: [{
                        attachment: url,
                        name: `${user.user.username}-filter-${filter}.png`
                    }]});
                }

            }
            else if (args.length == 1 && args[0]) {

                var filter = args[0].toLowerCase();

                if (!filters.includes(filter)) return message.channel.send("Please specify a valid filter.\nFilters include: Grayscale, Blur, Inverted, Deepfried, Sepia, Pixelated, Halloween, and HalloweenInverted.");
                if (filter.startsWith("halloween")) url = `https://cannicideapi.glitch.me/memes/`;

                url += `${filter.match("invert") && filter.match("halloween") ? "halloween" : filter}?image=${message.author.displayAvatarURL}`;

                if (filter.match("invert") && filter.match("halloween")) url += `&inverse=true`;

                message.channel.send({files: [{
                    attachment: url,
                    name: `${message.author.username}-filter-${filter}.png`
                }]});

            }
            else {
                message.channel.send("Please specify a valid filter.\nFilters include: Grayscale, Blur, Inverted, Deepfried, Sepia, Pixelated, Halloween, and HalloweenInverted.");
            }

        }, false, false, "Meme command to add a filter to a user's profile, such as grayscale or sepia.").attachArguments([
            {
                name: "usertag#1234 | your-filter",
                optional: false
            },
            {
                name: "their-filter",
                optional: true
            }
        ]),

        new Alias("filters", "filter")
    ]
}