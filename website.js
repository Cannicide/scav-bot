var DiscordSRZ = require("./discordsrz");

function setup(app, disc) {
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.get("/", (req, res) => {
        res.send("Sup, I'm the Scav Discord Bot. I don't have a fancy website yet. Blame Cannicide, he's too lazy to make one. As soon as it's made, it'll be here.");
    });
  
  /*app.get("/profile/:user/:discrim", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://cannicideapi.glitch.me");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var tag = req.params.user + "#" + req.params.discrim;
    res.send(disc.users.find(m => m.tag == tag).displayAvatarURL);
  });*/
  
  app.get("/statistics/json", (req, res) => {
      res.sendFile(__dirname + "/storage/statistics.json");
  });

  app.get("/statistics/", (req, res) => {
      res.sendFile(__dirname + "/views/statistics.html");
  })
  
  app.use(bodyParser.json());
  
  app.post("/discordsrz", (req, res) => {
    console.log("DiscordSRZ:", req.body);
    var srz = new DiscordSRZ(disc);
    new srz.DataHandler(req.body);
  });

}

module.exports = {
    setup: setup
}