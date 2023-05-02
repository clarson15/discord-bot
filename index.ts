import * as dotenv from "dotenv";
import * as fs from "fs";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai";

dotenv.config();

const discord = new Client({
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

let journal: string[] = [];
let systemMessage: string;

fs.readFile("journal.txt", "utf8", (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Journal: ${data}`);
    journal = data.split("\n");
});

fs.readFile("system.txt", "utf8", (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`System Message: ${data}`);
    systemMessage = data;
});

discord.on("ready", () => {
    console.log(`Logged in as ${discord.user?.tag}!`);
});

discord.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    try {
        let journalStr = journal.map((item, index) => `${index + 1}. ${item}`).join("\n");
        let messages = [
            {
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: `${systemMessage}\n`
                    + `At the end of your message, update your journal with journal commands. Keep track of information people give you and what you ask them. When they answer your question, remove it from your journal.\n`
                    + `Your journal commands are J_ADD [message], J_UPD [index] [message], J_DEL [index].\nExample: J_UPD: 1 I asked John how his day was.\n`
                    + `Current Journal:\n${journalStr}`
            },
            {
                role: ChatCompletionRequestMessageRoleEnum.User,
                content: `${message.author.username} says, "${message.content}"`
            }
        ];
        let response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 512
        });
        let responseStr = response.data.choices[0]?.message?.content || 'No Response.';
        let responses: string[] = [];
        let lines = responseStr.split("\n");
        for (let line of lines) {
            if (line.startsWith("J_")) {
                let command = line.split(" ")[0];
                let args = line.split(" ").slice(1);
                console.log(line);
                switch (command) {
                    case "J_ADD:":
                        addJournal(args.join(" "));
                        break;
                    case "J_UPD:":
                        updateJournal(parseInt(args[0]) - 1, args.slice(1).join(" "));
                        break;
                    case "J_DEL:":
                        deleteJournal(parseInt(args[0]) - 1);
                        break;
                    default:
                        break;
                }
            }
            else {
                responses.push(line);
            }
        }
        message.channel.send(responses.join("\n"));
    }
    catch (err) {
        message.channel.send("Unable to generate response. Please try again later.");
    }
});

let updateJournal = (index: number, message: string) => {
    journal[index] = message;
    fs.writeFile("journal.txt", journal.join("\n"), (err) => {
        if (err) {
            console.error(err);
        }
    });
};

let addJournal = (message: string) => {
    journal.push(message);
    fs.writeFile("journal.txt", journal.join("\n"), (err) => {
        if (err) {
            console.error(err);
        }
    });
};

let deleteJournal = (index: number) => {
    journal.splice(index, 1);
    fs.writeFile("journal.txt", journal.join("\n"), (err) => {
        if (err) {
            console.error(err);
        }
    });
};

discord.login(process.env.DISCORD_TOKEN);