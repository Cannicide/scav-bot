var DiscordSRZ = require("./discordsrz");
var stats = require("./evg").resolve("statistics");
var srz = require("./evg").resolve("srz");
var evidence = require("./evg").resolve("staff-evidence");
const fileUpload = require('express-fileupload');
const fetch = require("node-fetch");

function randomIdentifier() {
  var res = "";
  
  for (var i = 0; i < 11; i++) {
    res += "" + Math.floor(Math.random() * 9);
  }
  
  return res;
}

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
  
  app.use(fileUpload({
    createParentPath: true
  }));
    
    app.get("/", (req, res) => {
        res.send("Sup, I'm the Scav Discord Bot. I don't have a fancy website yet. Blame Cannicide, he's too lazy to make one. As soon as it's made, it'll be here.");
    });
  
  app.get("/profile/:user/:discrim", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://cannicideapi.glitch.me");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var tag = req.params.user + "#" + req.params.discrim;
    res.send(disc.users.cache.find(m => m.tag == tag).displayAvatarURL());
  });
  
  app.get("/statistics/json", (req, res) => {
      res.send(stats.all());
  });

  app.get("/statistics/", (req, res) => {
      res.sendFile(__dirname + "/views/statistics.html");
  })

  app.get("/userstats/json", (req, res) => {
    res.send(srz.values());
  });

  app.get("/userstats/", (req, res) => {
    res.sendFile(__dirname + "/views/userstats.html");
  });
  
  app.get(process.env.EVIDENCE_URL, (req, res) => {
    res.sendFile(__dirname + "/views/evidence.html");
  });
  
  app.get(process.env.SPP_URL, (req, res) => {
    res.sendFile(__dirname + "/views/punishments.html");
  });
  
  app.post(process.env.EVIDENCE_URL + "/upload", (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    
    var names = [];
    
    Object.values(req.files).forEach(file => {
      
      var buffer = Buffer.from(file.data);
      var name = randomIdentifier() + "-" + file.name.split("").reverse().join("").replace(".", "||").split("").reverse().join("");
      
      var base64 = buffer.toString("base64");
      
      evidence.set(name, base64);
      names.push(file.name);
      
    });
    
    res.send("Successfully uploaded: " + names.join(", "));
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/retrieveAll", (req, res) => {
    
    var items = evidence.all();
    res.send(items);
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/retrieve/:filename", (req, res) => {
    
    if (!req.params.filename) return res.status(500).send("No filename specified.");
    
    var filename = req.params.filename;
    
    if (!filename.match("\\|\\|")) filename = req.params.filename.split("").reverse().join("").replace(".", "||").split("").reverse().join("");
    
    var item = evidence.get(filename);
    if (!item) return res.status(500).send("No file with that name found.");
    
    var Readable = require('stream').Readable;
    const imgBuffer = Buffer.from(item, 'base64');
    var s = new Readable()

    s.push(imgBuffer)   
    s.push(null);

    s.pipe(res);
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/remove/:filename", (req, res) => {
    
    if (!req.params.filename) return res.status(500).send("No filename specified.");
    
    var item = evidence.has(req.params.filename);
    if (!item) return res.status(500).send("No file with that name found.");
    
    evidence.remove(req.params.filename);
    
    res.send("Successfully removed " + req.params.filename);
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/googledrive", async (req, res) => {
    
    fetch("https://www.googleapis.com/drive/v3/files?q=%27" + process.env.EVIDENCE_GD + "%27+in+parents&key=" + process.env.GD_KEY)
    .then(res => res.json())
    .then(body => {
      res.send(body);
    })
    .catch(err => res.status(503).send(err));
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/googledrive/fetchurl", (req, res) => {
    
    res.send(`https://drive.google.com/drive/folders/${process.env.EVIDENCE_GD}?usp=sharing`);
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/postevidence/:channelID/:name/:url", async (req, res) => {
    
    if (!req.params.url || !req.params.name) return res.status(500).send("No URL/name was specified.");
    
    var isdirect = decodeURIComponent(req.params.url).match("\\|\\|");
    
    var url = decodeURIComponent(req.params.url).replace("||", ".");
    var name = decodeURIComponent(req.params.name);
    var channel = disc.channels.cache.get(req.params.channelID);
    
    if (!channel) return res.status(500).send("Channel was not found");
    
    channel.send({
      embed: {
        "color": 16750336,
        "description": `**Rule Violation Evidence**\n\nA file from the [ScavengerCraft Evidence Panel](https://scav-bot.glitch.me${process.env.EVIDENCE_URL}) was beamed down to this channel.`,
        "image": isdirect && isImage(url) ? {url:url} : {},
        "fields": [{"name":"File Link",value:`[🔗](${url})`}],
        "footer": {
          "icon_url": channel.guild.iconURL({dynamic:true}),
          "text": `${name} • ${isdirect ? "Direct Upload" : "Google Drive Upload"}`
        }
      }
    });
    
    res.send("Successfully beamed down: " + url);
    
  });
  
  app.use(bodyParser.json());
  
  app.post("/discordsrz", (req, res) => {
    console.log("DiscordSRZ:", req.body);
    new DiscordSRZ.DiscordSRZ.DataHandler(req.body);
  });

}

module.exports = {
    setup: setup
}