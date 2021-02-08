//A built-in youtube music server for the discord bot based on that of my Elisif discord bot
//Powered by Youtube, my Evergreen API, and my CannicideAPI YT Audio API
//Dependencies: EvG 3.0, node-fetch
var evg = require("../evg").resolve("music");
var Command = require("../command");
var Interface = require("../interface");
var fetch = require("node-fetch");

const clientID = require("../handler").Client({}).user.id;

var events = require("events");
const evergreen = new events.EventEmitter();

function Queue(message) {

    var storage = {
        starter: message.author.id,
        songs: [],
        index: 0,
        loop: false,
        end: false,
        controller: false
    }

    function reloadStorage() {
        if (evg.has(message.guild.id)) {
            storage = evg.get(message.guild.id);
            return storage;
        }
        else return false;
    }

    function saveStorage() {
        evg.set(message.guild.id, storage);
    }

    this.get = () => {
        reloadStorage();

        return storage;
    }

    this.save = saveStorage;

    this.getSong = () => {

        reloadStorage();

        return storage.index >= storage.songs.length ? false : storage.songs[storage.index];

    }

    this.addSong = (name, id, author, msg, audio, keywords) => {

        reloadStorage();

        storage.songs.push({
            name: name,
            id: id,
            url: audio,
            artist: author,
            requester: msg.author.tag,
            keywords: keywords
        });

        saveStorage();

    }

    this.removeSong = (keywords) => {

        reloadStorage();

        var songKeywords = storage.songs.find(s => s.keywords == keywords.replace(/ /g, "+"));
        var songName = storage.songs.find(s => s.name == keywords);
        var songUrl = storage.songs.find(s => keywords.match("youtube.com/watch?v=" + s.id));

        if (songUrl) {
            storage.songs.splice(storage.songs.lastIndexOf(songUrl), 1);
        }
        else if (songKeywords) {
            storage.songs.splice(storage.songs.lastIndexOf(songKeywords), 1);
        }
        else if (songName) {
            storage.songs.splice(storage.songs.lastIndexOf(songName), 1);
        }
        else return false;

        saveStorage();

        if (storage.songs.length == 0) {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);
            conn.dispatcher.end();
            evergreen.emit("ended");
        }

        return true;

    }

    this.removeSongs = (keywords) => {

        var moreLeft = true;
        var iterations = 0;

        while (moreLeft) {
            moreLeft = this.removeSong(keywords);
            iterations++;
        }

        return iterations;

    }

    this.endQueue = () => {

        evg.remove(message.guild.id);

    }

    this.nextSong = () => {

        var isStorage = reloadStorage();

        if (!isStorage) {
            return false;
        }

        storage.index++;
        if (storage.index >= storage.songs.length) {

            storage.index = 0;

            if (storage.loop) {

                saveStorage();

                return storage.songs[storage.index];
            }

            this.endQueue();

            return false;
        }
        
        saveStorage();

        return storage.songs[storage.index];

    }

    this.prevSong = () => {

        var isStorage = reloadStorage();

        if (!isStorage) {
            return false;
        }

        storage.index--;
        if (storage.index < 0) {

            if (storage.loop) {

                storage.index = storage.songs.length - 1;

                saveStorage();

                return storage.songs[storage.index];
            }

            this.endQueue();

            return false;
        }
        
        saveStorage();

        return storage.songs[storage.index];

    }

    this.displaySong = (msg/*, player*/) => {

        reloadStorage();

        var song = storage.songs[storage.index];

        msg.channel.embed({
            desc: `\`(${storage.index + 1})\` **[${song.name}](https://www.youtube.com/watch?v=${song.id})**\n\n` +
            `\`Requested by: ${song.requester}\``,
            thumbnail: `https://img.youtube.com/vi/${song.id}/0.jpg`
        }).then((m) => {

            storage.controller = m.id;
            this.save();
          
            var loopEmotes = ["🔁", "🔃"];
            var loopEmote = loopEmotes[0];

            if (storage.loop) loopEmote = loopEmotes[1];

            m.react("⏪").then((r) => m.react(loopEmote).then((r2) => m.react("⏩")));

            let forwardsFilter = m.createReactionCollector((reaction, user) => reaction.emoji.name === '⏩' && user.id === msg.author.id, { time: 15 * 60 * 1000 });
            let loopFilter = m.createReactionCollector((reaction, user) => reaction.emoji.name === loopEmote && user.id === msg.author.id, { time: 15 * 60 * 1000 });
            let backFilter = m.createReactionCollector((reaction, user) => reaction.emoji.name === '⏪' && user.id === msg.author.id, { time: 15 * 60 * 1000 });
        
            forwardsFilter.on("collect", r => {
                r.users.remove(msg.author);

                var song = this.nextSong();
                var desc = "The queue has ended.";
                var image = false;
                
                if (song) desc = `\`(${storage.index + 1})\` **[${song.name}](https://www.youtube.com/watch?v=${song.id})**\n\n` +
                `\`Requested by: ${song.requester}\``;
                if (song) image = `https://img.youtube.com/vi/${song.id}/0.jpg`;

                var embed = new Interface.Embed(message, {
                    desc: desc,
                    thumbnail: image
                });
                m.edit(embed);

                var conn = msg.client.voice.connections.find(val => val.channel.guild.id == msg.guild.id);

                if (!conn) return msg.channel.embed({desc:`No music is currently being played in this guild.`});

                if (!song) {
                    m.reactions.cache.find(c => c.emoji.toString() == "⏩").users.remove(clientID);
                    m.reactions.cache.find(c => c.emoji.toString() == "⏪").users.remove(clientID);
                    m.reactions.cache.find(c => c.emoji.toString() == loopEmote).users.remove(clientID);
                    storage.end = ("skip:false");
                    this.save();
                    conn.dispatcher.end();
                }
                else {

                    var voiceChannel = msg.member.voice.channel;
                    if (!voiceChannel) return msg.channel.embed({dec:`You need to be in a voice channel first!`});

                    if (msg.author.id != this.get().starter || !msg.member.hasPermission("ADMINISTRATOR")) return msg.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});

                    storage.end = ("skip:" + song);
                    this.save();
                    conn.dispatcher.end();
                    msg.channel.embed({desc:`Skipped to next song, **[${msg.author.tag}](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id})**.`}).then(c => {
                        setTimeout(() => {
                            c.delete();
                        }, 3000);
                    });
                }
            });

            loopFilter.on("collect", r => {
                r.users.remove(msg.author);
                if (loopEmote == loopEmotes[0]) loopEmote = loopEmotes[1]
                else loopEmote = loopEmotes[0];

                r.remove(clientID);
                m.reactions.cache.find(c => c.emoji.toString() == "⏩").users.remove(clientID);
                m.react(loopEmote).then(r3 => m.react("⏩"));

                reloadStorage();

                storage.loop = !storage.loop;

                saveStorage();

                var song = storage.songs[storage.index];
                var desc = "The queue has ended.";
                var image = false;

                if (song) desc = `\`(${storage.index + 1})\` **[${song.name}](https://www.youtube.com/watch?v=${song.id})**\n\n` +
                `Loop: ${storage.loop}\n` +
                `\`Requested by: ${song.requester}\``;
                if (song) image = `https://img.youtube.com/vi/${song.id}/0.jpg`;

                var embed = new Interface.Embed(message, {
                    desc: desc,
                    thumbnail: image
                });
                m.edit(embed);

                if (!song) {
                    m.reactions.cache.find(c => c.emoji.toString() == "⏩").users.remove(clientID);
                    m.reactions.cache.find(c => c.emoji.toString() == "⏪").users.remove(clientID);
                    m.reactions.cache.find(c => c.emoji.toString() == loopEmote).users.remove(clientID);
                }
            });

            backFilter.on("collect", r => {
                r.users.remove(msg.author.id);

                var song = this.prevSong();
                var desc = "The queue has ended.";
                var image = false;
                
                if (song) desc = `\`(${storage.index + 1})\` **[${song.name}](https://www.youtube.com/watch?v=${song.id})**\n\n` +
                `\`Requested by: ${song.requester}\``;
                if (song) image = `https://img.youtube.com/vi/${song.id}/0.jpg`;

                var embed = new Interface.Embed(message, {
                    desc: desc,
                    thumbnail: image
                });
                m.edit(embed);

                var conn = msg.client.voice.connections.find(val => val.channel.guild.id == msg.guild.id);

                if (!conn) return msg.channel.embed({desc:`No music is currently being played in this guild.`});

                if (!song) {
                    m.reactions.cache.find(c => c.emoji.toString() == "⏩").users.remove(clientID);
                    m.reactions.cache.find(c => c.emoji.toString() == "⏪").users.remove(clientID);
                    m.reactions.cache.find(c => c.emoji.toString() == loopEmote).users.remove(clientID);
                    storage.end = ("skip:false");
                    this.save();
                    conn.dispatcher.end();
                }
                else {

                    var voiceChannel = msg.member.voice.channel;
                    if (!voiceChannel) return msg.channel.embed({desc:`You need to be in a voice channel first!`});

                    if (msg.author.id != this.get().starter || !msg.member.hasPermission("ADMINISTRATOR")) return msg.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});
    
                    storage.end = ("skip:" + song);
                    this.save();
                    conn.dispatcher.end();
                    msg.channel.embed({desc:`Skipped to previous song, **[${msg.author.tag}](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id})**.`}).then(c => {
                        setTimeout(() => {
                            c.delete();
                        }, 3000);
                    });
                }
            });
        
        });

    }

    reloadStorage();

}

function Player(message, pargs) {

    var queue = new Queue(message);
    var options = {
        name: "",
        id: "",
        author: "",
        msg: message,
        audio: "",
        keywords: ""
    }

    var methods = {
        play: (addingSong, dontDisplay) => {
            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});
            if (!pargs) return message.channel.embed({desc:`You need to specify music to search for!`});

            if (addingSong) queue.addSong(options.name, options.id, options.author, options.msg, options.audio, options.keywords);

            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);
            var song = queue.getSong();
          
            var controller = message.channel.messages.cache.get(queue.get().controller);
            if (controller) {
              var desc = `\`(${queue.get().index + 1})\` **[${song.name}](https://www.youtube.com/watch?v=${song.id})**\n\n` +
                `\`Requested by: ${song.requester}\``;
              var image = `https://img.youtube.com/vi/${song.id}/0.jpg`;

              var embed = new Interface.Embed(message, {
                  desc: desc,
                  thumbnail: image
              });
              controller.edit(embed);
            }
          
            if (conn) {
                if (!dontDisplay) queue.displaySong(message);
                
                const dispatcher = conn.play(song.url, {bitrate: 96});
                evergreen.removeAllListeners("ended");
                evergreen.on("ended", speaking => {
                  
                    var end = queue.get().end;
                  
                    var nextSong = end && end.match("skip") ? queue.getSong() : queue.nextSong();
                    if (end && end == "stopped") nextSong = false;

                    if (end && end.match("skip") && end.split("skip:")[1] == "false") nextSong = false;
                    end = false;
                    queue.save();

                    if (!nextSong) {
                        message.channel.embed({desc:`Queue has ended. Left music channel, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
                        voiceChannel.leave();
                        queue.endQueue();
                        dispatcher.destroy();
                    }
                    else methods.play(false, true);

                });
              
                dispatcher.on("speaking", speaking => {
                  if (!speaking) {
                    evergreen.emit("ended");
                  }
                });
            }
            else {
                voiceChannel.join().then(connection => {
                    message.channel.embed({desc:`Joined music channel, ${message.author.username}.`});

                    if (!dontDisplay) queue.displaySong(message);
                    
                    const dispatcher = connection.play(song.url, {bitrate: 96});
                    evergreen.removeAllListeners("ended");
                    evergreen.on("ended", speaking => {
                      
                        var end = queue.get().end;
                      
                        var nextSong = end && end.match("skip") ? queue.getSong() : queue.nextSong();
                        if (end && end == "stopped") nextSong = false;

                        if (end && end.match("skip") && end.split("skip:")[1] == "false") nextSong = false;
                        end = false;
                        queue.save();
                      
                      
                        if (!nextSong) {
                            message.channel.embed({desc:`Queue has ended. Left music channel, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
                            voiceChannel.leave();
                            queue.endQueue();
                            dispatcher.destroy();
                        }
                        else methods.play(false, true);

                    });
                  
                    dispatcher.on("speaking", speaking => {
                      if (!speaking) {
                        evergreen.emit("ended");
                      }
                    });
                
                }).catch(err => message.channel.send(`Errors found:\n \`\`\`${err}, ${err.stack}\`\`\``));
            }

        },
        stop: () => {

            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});

            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);
            if (!conn && voiceChannel) {
                voiceChannel.leave();
                return message.channel.embed({desc:`No music is currently being played in this guild.`});
            }

            if (message.author.id != queue.get().starter || !message.member.hasPermission("ADMINISTRATOR")) return message.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});
           
            queue.get().end = "stopped";
            queue.save();
            conn.dispatcher.end();
            message.channel.embed({desc:`Stopped music, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
        },
        resume: () => {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});

            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});

            if (message.author.id != queue.get().starter || !message.member.hasPermission("ADMINISTRATOR")) return message.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});
            if (!conn.dispatcher.paused) return message.channel.embed({desc:`Music in this guild is already resumed.`});
            
            conn.dispatcher.resume();
            message.channel.embed({desc:`Resumed music, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
        },
        pause: () => {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});

            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});

            if (message.author.id != queue.get().starter || !message.member.hasPermission("ADMINISTRATOR")) return message.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});
            if (conn.dispatcher.paused) return message.channel.embed({desc:`Music in this guild is already paused.`});
            
            conn.dispatcher.pause();
            message.channel.embed({desc:`Paused music, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
        },
        display: () => {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});
            
            queue.displaySong(message, methods);
        },
        skip: (isNext) => {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});

            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});

            if (message.author.id != queue.get().starter || !message.member.hasPermission("ADMINISTRATOR")) return message.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});
            
            if (isNext) queue.nextSong();
            else queue.prevSong();

            queue.get().end = "skip";
            queue.save();
            conn.dispatcher.end();
            message.channel.embed({desc:`Skipped to next song, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
        },
        removeSong: (args, removeAll) => {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});

            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});

            if (message.author.id != queue.get().starter || !message.member.hasPermission("ADMINISTRATOR")) return message.channel.embed({desc:`You must be the starter of the current queue or an administrator to do that.`});
            
            if (removeAll) {
                var removed = queue.removeSongs(args.join(" "));
                message.channel.embed({desc:`Removed ${removed - 1} song(s) from the queue, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
            }
            else {
                var removed = queue.removeSong(args.join(" "));
                if (removed) message.channel.embed({desc:`Removed song from the queue, **[${message.author.tag}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**.`});
                else message.channel.embed({desc:`Failed to remove song from the queue: could not find the song in the queue.`});
            }
        },
        queue: () => {
            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});

            var songs = queue.get().songs;
            var current = queue.get().index;

            var response = ``;
            var image = false;
            var nowplaying = {
                name: `🔸 Now Playing 🔸`,
                value: ``,
                inline: true
            }
            var addedinfo = {
                name: `🔹 Added Info 🔹`,
                value: ``,
                inline: true
            }

            songs.forEach((song, index) => {

                var addon = "";
                if (index == current) {
                    addon += ` 🔸`;
                    image = `https://img.youtube.com/vi/${song.id}/0.jpg`

                    var parts = song.name.split(" - ");
                    var name = parts[1];
                    var author = parts[0];

                    nowplaying.value = `**[${name}](https://youtube.com/watch?v=${song.id})**\nBy ${author}`;
                    addedinfo.value = `Uploaded by ${song.artist}\nRequested by **[${song.requester}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id})**`;
                }

                response += `\`(${index + 1})\` ${addon != "" ? "**" : ""}[${song.name}](https://youtube.com/watch?v=${song.id})${addon != "" ? "**" : ""}${addon}\n`;

            });

            var embed = new Interface.Embed(message, {
                desc: response,
                icon: message.guild.iconURL({dynamic: true}),
                title: "Music Queue",
                thumbnail: image,
                fields: [nowplaying, addedinfo]
            });

            message.channel.send(embed);
        },
        addQueue: () => {

            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (!conn) return message.channel.embed({desc:`No music is currently being played in this guild.`});

            var voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.embed({desc:`You need to be in a voice channel first!`});

            fetch("https://cannicideapi.glitch.me/yt/details/" + pargs.join("+"))
            .then(resp => resp.json())
            .then(res => {
                options.name = res.details.name;
                options.id = res.details.id;
                options.author = res.details.author;
                options.keywords = pargs.join("+");
                options.audio = "https://cannicideapi.glitch.me/yt/name/" + options.keywords;
                var image = `https://img.youtube.com/vi/${options.id}/0.jpg`

                queue.addSong(options.name, options.id, options.author, options.msg, options.audio, options.keywords);
                message.channel.embed({
                    desc: `Added **${options.name}** (uploaded by \`${options.author}\`) to the queue.`,
                    thumbnail: image
                });
            })
            .catch(() => {
                console.error("Could not fetch music details from CannicideAPI.");
                message.channel.embed({
                    desc: `Unable to fetch music details and audio from CannicideAPI.`
                });
            })

        }
    }

    return new Promise((resolve, reject) => {
        if (pargs) {
            fetch("https://cannicideapi.glitch.me/yt/details/" + pargs.join("+"))
            .then(resp => resp.json())
            .then(res => {
                options.name = res.details.name;
                options.id = res.details.id;
                options.author = res.details.author;
                options.keywords = pargs.join("+");
                options.audio = "https://cannicideapi.glitch.me/yt/name/" + options.keywords;

                resolve(methods);
            })
            .catch(() => {
                reject(new Error("Could not fetch music details from CannicideAPI."));
            })
        }
        else {
            resolve(methods);
        }
    });

}

module.exports = {
    commands: [
        new Command("play", {
            desc: "Play a specified song in the voice channel you are in. If already playing a song, the specified song will be added to the queue.",
            cooldown: 5,
            args: [
                {
                    name: "keywords",
                    optional: false,
                    feedback: "Please specify music to search for and play! At the moment only keywords are supported (no direct URLs)."
                }
            ]
        }, (message) => {

            var conn = message.client.voice.connections.find(val => val.channel.guild.id == message.guild.id);

            if (conn) {
                new Player(message, message.args).then((player) => {
                    player.addQueue();
                });
            }
            else {
                new Player(message, message.args).then((player) => {
                    player.play(true);
                });
            }

        }),

        new Command("pause", {
            desc: "Pauses the currently playing song.",
            cooldown: 5
        }, (message) => {

            new Player(message, false).then((player) => {
                player.pause();
            })

        }),

        new Command("stop", {
            desc: "Stops the currently playing song, clears the queue, and disconnects the bot from your voice channel.",
            cooldown: 10
        }, (message) => {

            new Player(message, false).then((player) => {
                player.stop();
            })

        }),

        new Command("resume", {
            desc: "Resumes the currently paused song, if paused.",
            cooldown: 5
        }, (message) => {

            new Player(message, false).then((player) => {
                player.resume();
            })

        }),

        new Command("skip", {
            desc: "Skips the currently playing song, and starts playing the next song in the queue.",
            cooldown: 5
        }, (message) => {

            new Player(message, false).then((player) => {
                player.skip(true);
            })

        }),

        new Command("song", {
            desc: "Sends song information as well as controls for queue loop and skipping to the next/previous song in the queue.",
            cooldown: 10,
            aliases: ["songcontrols", "playcontrols", "nowplaying", "songinfo"]
        }, (message) => {

            new Player(message, false).then((player) => {
                player.display();
            })

        }),

        new Command("queue", {
            desc: "Remove songs from the queue, remove all duplicates of a song from the queue, add a song to the queue, or list the songs in the queue.",
            args: [
                {
                    name: "remove | removeall | add | list",
                    optional: true
                }
            ],
            cooldown: 5,
            aliases: ["songlist", "songs"]
        }, (message) => {

            var args = message.args;
            var arg = args[0];

            if (!args || !args[0] || args.length < 1) arg = "list";

            switch(arg.toLowerCase()) {
                case "remove":
                    if (args.length < 2) return message.channel.embed({desc:`Please specify a song to remove, ${message.author.tag}.`});

                    new Player(message, false).then((player) => {
                        player.removeSong(args.slice(1), false);
                    })
                break;
                case "removeall":
                    if (args.length < 2) return message.channel.embed({desc:`Please specify a song to remove all of, ${message.author.tag}.`});

                    new Player(message, false).then((player) => {
                        player.removeSong(args.slice(1), true);
                    })
                break;
                case "add":
                    if (args.length < 2) return message.channel.embed({desc:`Please specify the keywords of a song to add, ${message.author.tag}.`});

                    new Player(message, args.slice(1)).then((player) => {
                        player.addQueue();
                    })
                break;
                default:
                    new Player(message, false).then((player) => {
                        player.queue();
                    })
                break;
            }

        })
    ]
}