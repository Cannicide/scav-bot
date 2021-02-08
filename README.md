# scav-bot
Scav Bot, or Scavenger, the official discord bot for the ScavengerCraft minecraft server. Completely open-source and built with discord.js. Includes many of the features from zh-bot, such as suggestion reactions, as well as completely unique features such as ScavengerLink (formerly DiscordSRZ) and SibyllAI chatbot.

## Advanced and Fully Open-Source Features
Suggestion reaction votes, polls with progress bars, minecraft and discord server statistics, moderation/management commands and features, Trello integrations, timezone and translation and definition utilities, minecraft-discord linking capabilities and leaderboards for linked users, advanced music features with progress bars and reaction controls, giveaway features, an easy-to-use paginated help command, and more!

## Platform Integrations
Scav Bot can link with Trello boards and Minecraft plugins to deliver powerful platform integrations. Use our Trello features to automatically send upvoted suggestions to a list on a Trello board! Use our Minecraft features to allow your Minecraft players to link their Minecraft and Discord accounts, and allow linked users to view their stats on a leaderboard!

## Gather User Input
Through suggestion reaction votes and poll features, Scav Bot can help you survey your members for opinions on anything and see the results! Suggestion reactions add yea/nay votes to suggestions, allowing you to see if a suggestion is agreed with or not. Polls create yea/nay or multiple choice votes on any given question, graphically showing the results with actual progress bars! Both of these features allow you to determine what your users want with just a quick glance. Furthermore, use the giveaway feature to create giveaways that your members can win! Gathering user input and creating an interactive environment has never been easier.

## Moderation and Management
Scav Bot has advanced yet easy-to-use moderation and management features that allow you to tackle issues in your server with ease. Here are some of the moderation/management commands and features included in this bot:

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
- `/clearsuggestions` - Takes all of the upvoted suggestions (suggestion reaction votes with more yeas than nays) in the suggestion channel in which the command is used, and posts them on a Trello board. The suggestion channel is then cleared, and a message showing how to create suggestion reaction votes is sent. Only works on suggestion channels.

## Music
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

## The Future of Scav Bot
I plan to further improve the systems of this bot in the future. Settings and customization updates are coming soon, as well as server-side configuration options. I will also be adding more functionality to the custom command class and handler, including additional events, more extended message object features, and more extended objects overall (such as an extended guild object).

I will also be looking into removing hard-coded values throughout the code. I want to make it easier to recreate, fork, or modify this bot. Eventually, I want to merge this bot's code with that of Panacea (formerly zh-bot) and create a single Panacea bot. Since this bot shares many features with Panacea already, it makes sense for the two bots to be one and always have the most up-to-date features, instead of one or the other having a more updated version of the same feature. When I do eventually make this shift, which I won't really have the time to do anytime soon, I will update this README with information on the new Panacea bot and archive this repository.

Scav Bot is the latest discord bot I have developed, and as such has some of the most advanced features of all of my bots. I want to get all of those advanced features into my other, more popular bots so that these features will be able to reach more people.

## Credits
Created by **Cannicide#2753**
Based on the features of the Panacea and Elisif discord bots, both of which were also created by Cannicide
Largely powered by CannicideAPI