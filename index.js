require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs'); // استيراد مكتبة للتعامل مع ملفات JSON
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});
//-----------------------------------------------------------------------------
client.on('ready', () => {
  console.log(``);
  console.log(`</> Logged in as : ${client.user.tag}!`);
  console.log(`</> Servers : ${client.guilds.cache.size}`);
  console.log(`</> Users : ${client.users.cache.size}`);
  console.log(`</> channels : ${client.channels.cache.size}`);
  console.log(`</> Name : ${client.user.username}`);
  client.user.setStatus('idle');///dnd/online/idle
  let status = [`By : Abu,Gabaaal`];
  setInterval(()=>{
  client.user.setActivity(status[Math.floor(Math.random()*status.length)]);
  },5000)
})

client.on("messageCreate", (message) => {
  if (message.content.startsWith("saym")) {
    const args = message.content.slice("saym".length).trim();
    const user = message.author;
    if (!args) return message.reply("Please provide me a message! ⚠️");
    message.channel.send(args);
  }
});
//-----------------------------------------------------------------------------

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);
//-----------------------------------------------------------------------------
// قراءة ملف الإعدادات JSON
let settings = {};
try {
  const settingsData = fs.readFileSync('settings.json', 'utf8');
  settings = JSON.parse(settingsData);
} catch (error) {
  console.error('خطأ في قراءة ملف الإعدادات JSON:', error);
}
//-----------------------------------------------------------------------------
// قائمة بمعرفات القنوات المرتبطة
const channelIds = settings.CHANNEL_IDS || [];
//-----------------------------------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  // التحقق مما إذا كانت الرسالة مرسلة في إحدى القنوات المعرفة
  if (!channelIds.includes(message.channel.id)) {
    return;
  }
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: 'You are a friendly chatbot.' },
  ];
  // دالة لتنفيذ التأخير بين كل طلب
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    message.react("<:CHAT_GPT:1230618176182812733>");
    prevMessages.forEach((msg) => {
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        // max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });

    if (result && result.data && result.data.choices && result.data.choices[0] && result.data.choices[0].message && result.data.choices[0].message.content) {
      const mentionedUser = message.author; // اسم الشخص الذي سيتم mention عليه
      let messageContent = result.data.choices[0].message.content;

      // فحص طول المحتوى والتأكد من أنه لا يتجاوز 2000 حرف
      if (messageContent.length > 2000) {
        message.channel.send("طول المحتوى يتجاوز 2000 حرف. لا يمكنني إرسال الرسالة.");
        return;
      }

      try {
        if (result) {
          // إرسال النتيجة إلى الشات
          message.channel.send(`${mentionedUser} \n ${messageContent}`);
        } else {
          console.log('النتيجة غير متاحة بعد');
        }
      } catch (error) {
        console.log(`ERR: ${error}`);
        // إرسال رسالة الخطأ إلى الشات
        message.channel.send(`<@${message.author.id}> \n حدثت مشكلة أثناء الاستجابة. برجاء عدم التسرع في إرسال الأسئلة لأن ذلك يسبب لي مشكلة في معالجة بياناتي. \n <@803873969168973855> هذه المشكلة مؤقتة وجاري حل المشكلة في أقرب وقت من قبل المطور`);
      }
    }
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

//-----------------------------------------------------------------------------
client.login(process.env.TOKEN);
//-----------------------------------------------------------------------------