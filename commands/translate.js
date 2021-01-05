//Translates text from a detected language to a provided language
//Using Google Translate

const Command = require("../command");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = new Command("translate", {
  desc: "Easily translate text to a specified language, powered by Google Translate.",
  cooldown: 5,
  args: [
    {
      name: "text",
      feedback: "Please specify some text to translate."
    },
    {
      name: "to",
      static: true,
      optional: true
    },
    {
      name: "language",
      optional: true
    }
  ]
}, (message) => {

  var plusArgs = "translate+" + message.args.join("+");
  var spaceArgs = message.args.join(" ");

  if (message.args.length < 3 || message.args[message.args.length - 2].toLowerCase() != "to") {
    plusArgs += "+to+English";
  }
  else {
    spaceArgs = spaceArgs.split("").reverse().join("").replace(/ot/i, "%replacer%").split("%replacer%")[1].split("").reverse().join("");
  }

  fetch(`https://www.google.com/search?q=${plusArgs}`)
  .then(res => res.text())
  .then(body => {
    var $ = cheerio.load(body);

    var translation = $(".MUxGbd.u31kKd.gsrt.lyLwlc").text();
    var lang = $('select[aria-label="Select target language"] > option[selected]').attr("value");

    message.channel.embed({
      desc: `Original: ${spaceArgs}\n\nTranslation (${lang ? lang : "Unknown"}): ${translation == "" ? "Unable to translate." : translation}`
    });
  })
  .catch(err => {
    message.channel.send("Failed to translate the text; please notify Cannicide#2753.");
  });

});