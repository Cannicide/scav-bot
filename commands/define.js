//Meme command to create image definitions with custom text

var Command = require("../command");

module.exports = new Command("define", (message, args) => {

    var url;
    args = args && args.length > 0 ? args.join(" ").split(" | ") : args;

    if (args.length == 1 && args[0]) {
        //Define actual word

        url = `https://cannicideapi.glitch.me/lang/define/image?q=${args[0].replace(/ /g, "+")}`;

        message.channel.send({files: [{
            attachment: url,
            name: `${args[0]}-definition.png`
        }]});

    }
    else if (args.length == 2 && args[0] && args[1]) {
        //Make meme definition

        url = `https://cannicideapi.glitch.me/memes/definition?word=${args[0]}&definition=${args[1]}`;

        message.channel.send({files: [{
            attachment: url,
            name: `${args[0]}-definition.png`
        }]});

    }
    else {
        //Error message

        message.channel.send("Please specify a word and definition separated by a pipe character.\nEx: `/define Scyxer | Player who is bad at Among Us.`\n\nOr, specify just a word to fetch its real definition.\nEx: `/define Context`");
    }

}, false, false, "Meme command to generate an image definition with custom text; word and definition separated by pipe (`|`) character.").attachArguments([
    {
        name: "word",
        optional: false
    },
    {
        name: " | definition",
        optional: true
    }
]);