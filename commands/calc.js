//Calculate a ton of different mathematical expressions

const Command = require("../command");
const math = require("mathjs");
const parser = math.parser();

module.exports = new Command("calc", async (message, args) => {

    //This command is staff-only due to security risks:
    //malicious javascript can potentially be injected through this command,
    //or immensely large operations can be run with the intent of shutting the bot down.

    //The math parser takes security precautions to avoid these situations, but
    //loopholes and vulnerabilities may still potentially exist

    if (args.length >= 1) {
        //Command being used correctly
        var expression = args.join(" ");

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

    }
    else {
        //Command not being used correctly

        message.channel.send("Please specify a mathematical expression to evaluate. Everything from simple arithmetic to unit conversion to derivatives are supported.");

    }

}, {
    roles: ["Staff"]
}, false, "Calculate various mathematical expressions, convert units, and more.").attachArguments([
    {
        name: "expression",
        optional: false
    }
]);