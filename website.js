// var DiscordSRZ = require("./discordsrz");
// var srz = require("./evg").resolve("srz");

function isImage(url) {
  var splitter = url.split(".");
  switch (splitter[splitter.length - 1]) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "apng":
      case "svg":
      case "webp":
        return true;
      default:
        return false;
  }
}

function setup(app, disc) {
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.get("/", (req, res) => {
        res.send("Sup, I'm the Scav Discord Bot. I don't have a fancy website yet. Blame Cannicide, he's too lazy to make one. As soon as it's made, it'll be here.");
    });
  
  app.get("/profile/:user/:discrim", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://cannicideapi.glitch.me");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var tag = req.params.user + "#" + req.params.discrim;
    res.send(disc.users.cache.find(m => m.tag == tag).displayAvatarURL());
  });
  
  app.get("/tag/from/:id", (req, res) => {
    if (!req.params.id) return res.send("Nope");
    var user = disc.users.cache.find(m => m.id == req.params.id);
    
    if (!user) return res.send("Nope");
    res.send(user.tag);
  });
  
  app.get(process.env.STAFFLIST_URL, async (req, res) => {
    var channel = disc.channels.cache.find(c => c.id == "780526546846875748");
    if (!channel) return res.send("Nope; channel not found.");
    
    var msg = await channel.messages.fetch("789697685975203851");
    if (!msg) return res.send("Nope; message not found.");
    
    res.send(msg.content);
  });

  // app.get("/userstats/json", (req, res) => {
  //   res.send(srz.values());
  // });

  // app.get("/userstats/", (req, res) => {
  //   res.sendFile(__dirname + "/views/userstats.html");
  // });
  
  // DiscordSRZ/ScavengerLink [ TO BE REPLACED WITH KATALINA ]
  
  // app.post("/discordsrz", (req, res) => {
  //   console.log("DiscordSRZ:", req.body);
  //   new DiscordSRZ.DiscordSRZ.DataHandler(req.body);
  // });

}

module.exports = {
    setup: setup
}