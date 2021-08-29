//Translates text from a detected language to a provided language
//Using Google Translate

const { SlashCommand, fetch } = require("elisif");
const { ArgumentBuilder } = SlashCommand;
const cheerio = require("cheerio");

module.exports = new SlashCommand({
  name: "translate",
  desc: "Easily translate text to a specified language using Google Translate!",
  guilds: JSON.parse(process.env.SLASH_GUILDS),
  args: [

    new ArgumentBuilder()
    .setName("text")
    .setDescription("The text to translate.")
    .setType("string"),

    new ArgumentBuilder()
    .setName("language")
    .setDescription("The language to translate to. Defaults to English.")
    .setType("string")
    .setOptional(true)

  ],
  execute(slash) {

    var { text, language } = slash.mappedArgs.toObject();
    language = language ?? "English";

    slash.deferReply();

    fetch(`https://www.google.com/search?q=translate+${text.replace(/ /g, "+")}+to+${language.replace(/ /g, "+")}`)
    .then(res => res.text())
    .then(body => {
      var $ = cheerio.load(body);

      var translation = $(".MUxGbd.u31kKd.gsrt.lyLwlc").text();
      var lang = $('select[aria-label="Select target language"] > option[selected]').attr("value");

      slash.editReply(slash.interface.genEmbeds({
        desc: `Original: ${text}\n\nTranslation (${lang ? lang : "Unknown"}): ${translation == "" ? "Unable to translate." : translation}`
      }, slash));
    })
    .catch(_err => {
      slash.editReply("Failed to translate the text; please notify Cannicide#2753.");
    });

  }
});