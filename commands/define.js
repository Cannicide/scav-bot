//Meme command to create image definitions with custom text

const { SlashCommand } = require("elisif");
const { ArgumentBuilder } = SlashCommand;

module.exports = new SlashCommand({
    name: "define",
    desc: "Generate an image with an actual word definition, or with a custom meme definition!",
    guilds: JSON.parse(process.env.SLASH_GUILDS),
    args: [
        new ArgumentBuilder()
        .setName("word")
        .setDescription("The word you want to define.")
        .setType("string"),
        new ArgumentBuilder()
        .setName("definition")
        .setDescription("Custom text to use instead of the actual word definition.")
        .setType("string")
        .setOptional(true)
    ],

    execute(slash) {

        let attachment;
        let args = slash.flatArgs;

        if (args.length == 1 && args[0]) {
            //Define actual word

            attachment = `https://cannicideapi.glitch.me/lang/define/image?q=${args[0].replace(/ /g, "+")}`;

            slash.reply({files: [{
                attachment,
                name: `${args[0]}-definition.png`
            }]});

        }
        else if (args.length == 2 && args[0] && args[1]) {
            //Make meme definition

            attachment = `https://cannicideapi.glitch.me/memes/definition?word=${args[0].replace(/ /g, "+")}&definition=${args[1].replace(/ /g, "+")}`;

            slash.reply({files: [{
                attachment,
                name: `${args[0]}-definition.png`
            }]});

        }

    }
});