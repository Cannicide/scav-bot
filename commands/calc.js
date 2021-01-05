//Calculate a ton of different mathematical expressions

const Command = require("../command");
const math = require("mathjs");
const parser = math.parser();

module.exports = new Command("calc", {
    roles: ["Staff"],
    desc: "Calculate various mathematical expressions, convert units, and more.",
    args: [
        {
            name: "expression",
            optional: false,
            feedback: "Please specify a mathematical expression to evaluate. Everything from simple arithmetic to unit conversion to derivatives are supported."
        }
    ],
    cooldown: 5,
    aliases: ["calculate"]
}, async (message) => {

    //This command is staff-only due to security risks:
    //malicious javascript can potentially be injected through this command,
    //or immensely large operations can be run with the intent of shutting the bot down.

    //The math parser takes security precautions to avoid these situations, but
    //loopholes and vulnerabilities may still potentially exist

    //Command being used correctly
    var expression = message.args.join(" ");

    if (expression == "clear" || expression == "clear memory" || expression == "clearmem") {
        parser.clear();
        return message.channel.send("```\nCleared defined mathematical variables and functions from memory.```");
    }

    var result;

    try  {
        result = await parser.evaluate(expression);
    }
    catch (err) {
        result = err.message;
    }

    message.channel.send("```\n" + result + "```");

});