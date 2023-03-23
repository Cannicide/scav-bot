**This repository is archived.**

The ScavengerCraft Discord bot is no longer in use and has not been in use for years, following the downfall of the ScavengerCraft Minecraft server. The code in this repository is severely outdated, and built for a much older version of both Discord and discord.js. Use the code with caution, as it will almost definitely cause errors.

# scav-bot
Scav Bot, or Scavenger, the official discord bot for the ScavengerCraft minecraft server. Completely open-source and built with discord.js. Includes many of the features from zh-bot, such as suggestion reactions, as well as completely unique features such as ScavengerLink (formerly DiscordSRZ) and SibyllAI chatbot.

## Advanced and Fully Open-Source Features
Suggestion reaction votes, polls with progress bars, minecraft and discord server statistics, moderation/management commands and features, Trello integrations, timezone / translation / definition utilities, minecraft-discord linking capabilities and leaderboards for linked users, advanced music features with progress bars and reaction controls, giveaway features, an easy-to-use paginated help command, a simple AI chatbot, and more!

## Platform Integrations
Scav Bot can link with Trello boards and Minecraft plugins to deliver powerful platform integrations. Use our Trello features to automatically send upvoted suggestions to a list on a Trello board! Use our Minecraft features to allow your Minecraft players to link their Minecraft and Discord accounts, and allow linked users to view their stats on a leaderboard!

## Gather User Input
Through suggestion reaction votes and poll features, Scav Bot can help you survey your members for opinions on anything and see the results! Suggestion reactions add yea/nay votes to suggestions, allowing you to see if a suggestion is agreed with or not. Polls create yea/nay or multiple choice votes on any given question, graphically showing the results with actual progress bars! Both of these features allow you to determine what your users want with just a quick glance. Furthermore, use the giveaway feature to create giveaways that your members can win! Gathering user input and creating an interactive environment has never been easier.

## Completely Up-to-Date
Scav Bot now uses my `node-elisif` discord bot framework, with its much more advanced features and command handling system. Based off of the systems used by Scav Bot, Panacea, and Elisif Casino, node-elisif improved and rewrote much of the functionality of my discord bots. This new framework now also uses discord.js v13.x.x, allowing Scav Bot to use new features such as slash commands, buttons, and more! Every single feature in Scav Bot, except for the disabled features, have been rewritten to use the new features and to perform/feel better overall.

In addition, ALL commands in Scav Bot have been converted into slash commands, with exception to the help, eval, games, and VCA commands imported via node-elisif expansions (node-elisif is still in development, and these expansion commands have not been converted into slash commands yet). Scav Bot v3.0.0 utilizes node-elisif v3.4.1-dev.

## Moderation and Management
CURRENTLY DISABLED. While moderation features do exist in the Scav Bot, they are currently disabled pending the release of a new moderation system I have been working on for the node-elisif package. The new moderation system will include all of the previous moderation features of Scav Bot, plus new automoderation features such as NSFW image detection! The moderation system of Scav Bot will be much more premium, while remaining 100% free.
<!---Scav Bot has advanced yet easy-to-use moderation and management features that allow you to tackle issues in your server with ease. Here are some of the moderation/management commands and features included in this bot:

- `/purge <# of messages>` - Bulk-deletes messages.
- `/mute <user> [reason]` - Mutes a given user by giving them the *Muted* role. If they try to leave and rejoin to evade the mute, the role will automatically be added to them again.
- `/unmute <user> [reason]` - Unmutes a muted user.
- `/kick <user> [reason]` - Kicks a given user, but remembers the roles they had. All of their roles will be preserved when they rejoin. Allows you to kick ranked users that are being annoying/toxic, or to kick a staff member or such without having to manually re-add their roles.
- `/ban <user> [reason]` - Bans the given user.
- `/permaban <user> [reason]` - A high-level ban command only usable by members with the "ADMINISTRATOR" perm. Permabanned users cannot rejoin until the unban command is used, even if unbanned through discord. This can be used to prevent a bot or abusive moderator from unbanning a specific banned individual. 
- `/unban <user> [reason]` - Unbans the given user. Requires "ADMINISTRATOR" perm, as this removes both bans and permabans.
- `/history <user>` - Views the punishment history of the given user. All punishments dealt through the above commands will be viewable here.
- `/clearhistory <user>` - Clears the punishment history of the given user. Requires "ADMINISTRATOR" perm. *Note: this does not unmute or unban punished users; it only clears the history logs.*
- `/clearchannel` - Completely clears the channel in which the command is used. Does not work on suggestion channels.
- `/clearsuggestions` - Takes all of the upvoted suggestions (suggestion reaction votes with more yeas than nays) in the suggestion channel in which the command is used, and posts them on a Trello board. The suggestion channel is then cleared, and a message showing how to create suggestion reaction votes is sent. Only works on suggestion channels.-->

## Music
CURRENTLY DISABLED. For the same reason as Moderation, music features are disabled pending the release of a new music system I will be developing for node-elisif. The new system will include many of the planned features listed below. See below for all existing and planned features.

Scav Bot has the most advanced music features I have ever designed; these are music features that I took from my outdated Elisif discord bot, and redesigned/upgraded them to look and perform better. Music features include:

- A guild-based queue system in which every guild has a music queue.
- Ability to add songs to the queue, remove song(s) from the queue, and list the songs in the queue
- Ability to play, pause, resume, stop, loop, remove, and skip music.
- Add songs to the queue through queue or play commands, using keywords to search for music from Youtube.
- A song controller with reaction controls to go to the previous song, go to the next song, or toggle queue loop.
- A progress bar found in the song controller embed that indicates song progress.
- Song controller dynamically and automatically updates to show the currently playing song, with its title, author, thumbnail, requester, and play progress.
- Ability to recreate/repost the song controller if it gets buried under a ton of messages.
- Thoroughly tested and works in the latest versions of Discord.js (v12+), unlike the original Elisif music code
- All messages in the music system use pretty embeds with markdown, for better-looking messages than that of the original Elisif music system

Planned, but not yet implemented, features:

- Ability to add songs to queue using youtube video and playlist URLs
- Add ability to search for multiple songs at once (with one command use instead of multiple)
- Allow users to create individual playlists
- Allow users to import the current queue into their individual playlists
- Allow users to load their individual playlists into the current queue
- Potentially allow users to listen to music via DMs and DM groups, if either are even possible in the Discord API
- Find a way to further increase audio quality
- Potentially create a radio system that is always broadcasting a predefined queue and can be accessed in a guild through commands
- Potentially allow use of music commands and features through SibyllAI Chatbot

## VCA
Voice Channel Activities (VCA) has been added to Scav Bot! VCA, also referred to as "embedded applications" or "discord together", allows guild members to participate in activities embedded *within* voice channels! Using VCA, you can play chess, watch a youtube video, play poker, and more in real-time with your fellow guild members, all without leaving a voice channel.

VCA is a Discord feature that is currently in private beta. It can be used in any guild via a bot such as Scav Bot. Eventually, once the feature is released, you will be able to start voice channel activities within your Discord client itself (similar to screensharing). If you would like to add VCA to your own bot, you can get the VCA expansion from my `node-elisif` NPM package.

## Games
Games are being added to Scav Bot! Currently, only a Trivia game has been added. Trivia uses the new Discord select menu feature, making it easy to select an answer to a difficult trivia question! Additional games are in development. When the Points system is completed, users will be able to earn some extra points by winning games such as Trivia.

## The Future of Scav Bot
Note: the future is here! Many of the planned features previously listed below have already been developed, or are in development. Some, such as settings and increased configurability, are already available in the Scav Bot as of v3.0.0!

Settings and customization updates, as well as server-side configuration options, are here! I have also added much more functionality to the custom command class and handler, more message utility features, and more utilities overall (such as for guilds, channels, members, and slash interactions).

I will also be looking into removing hard-coded values throughout the code; some, however, have already been removed and replaced with the new settings features. I want to make it easier to recreate, fork, or modify this bot. Eventually, I want to transform this bot into a public bot that can be used in more guilds; currently, it is only used in the [ScavengerCraft](https://scavengercraft.net) guild. When I do eventually make this shift, and find more sustainable bot hosting options, I will update this README with information on how to invite the bot to your own guild!

I will also be drastically improving the Sibyll chatbot, as it is pretty limited and inaccurate as it is now. I have already begun developing Sibyll 2.0 with better working, more accurate code, but I want to first complete and release it as a node-elisif expansion before utilizing it in Scav Bot. My previous plan to allow manipulation of Scav Bot features such as music and polls through conversing with the chatbot, as another way of using features other than commands and reaction controls, will no longer be implemented due to the conversion of all commands into slash commands in Scav Bot v3.0.0.

## Planned Features and In Development
For the sake of suspense, I will not append any descriptions to this list of planned features.

- Better Moderation and new Automoderation systems
- Better Music system
- New Points system
- New Minecraft-Discord linking system (Katalina)
- New meme commands (e.g. filters)
- More game and entertainment commands
- Better chatbot system (Sibyll 2.0)
- Adding slash commands to help command
- Rebranding, renaming, and publication of Scav Bot
- Web dashboard and homepage for Scav Bot
- Button and Select Menu based polling options
- More and better Platform Integrations

## Credits
Created by **[Cannicide#2753](https://github.com/Cannicide)**\
Based on the features of the Panacea and Elisif discord bots, both of which were also created by Cannicide\
Powered by CannicideAPI, [node-elisif](https://github.com/Cannicide/node-elisif)
