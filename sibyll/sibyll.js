var trainer = require("./trainer");
const fs = require("fs");
var sibyll;

var dir = __dirname || ".";

function load() {
    var packs = [];

    var files = fs.readdirSync(dir + "/packs");
    files.forEach((item) => {
        var file = fs.readFileSync((`${dir}/packs/${item}`));
        var obj = JSON.parse(file);

        packs.push(obj);
    });

    sibyll = new trainer.Trainer();

    packs.forEach((item) => {

        //Item is json file
        for (var action in item) {

            //Action is a category of speech that has inputs and outputs
            var cat = new trainer.Action(action);

            item[action].outputs.forEach((output) => {

                cat.add(output);

            });

            if ("iscustom" in item[action] && item[action].iscustom) {

                item[action].inputs.forEach((input) => {
                    cat.addInput(input);
                });

                sibyll.addCustom(cat);

                if ("fetch" in item[action] && item[action].fetch) {
                    sibyll.addFetch(cat, item[action].fetch);
                }
            }
            else {

                item[action].inputs.forEach((input) => {

                    sibyll.train(input, cat);

                });

            }

        }

    });

    sibyll.unknown.add("I'm not sure what you're talking about. If I'm missing something big in my vocabulary, please let Cannicide know!");
    sibyll.unknown.add("Could you repeat that? If I'm missing something big in my vocabulary, please let Cannicide know!");
    sibyll.unknown.add("I don't understand. If I'm missing something big in my vocabulary, please let Cannicide know!");
    sibyll.unknown.add("Sorry, I don't know what you're saying. If I'm missing something big in my vocabulary, please let Cannicide know!");
}

load();

module.exports = sibyll;