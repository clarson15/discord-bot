# discord-bot
Chat-GPT + Discord.js for chatbot with basic memory support


# Usage
configure .env (see .env.example) with your OpenAI API key + Discord token  
configure system.txt with the system message you'd like to give your bot  
configure journal.txt with any prerequisite knowledge you'd like your bot to have (each line is a new item in the journal)  
`npm install`  
`npm run start`  
Invite your discord bot to your server


The bot is instructed to record information about it's conversations with users in its journal with the commands J_ADD, J_UPD, J_DEL. If a line does not start with those commands, it's included in the response to the user. 
