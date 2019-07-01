const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const Unity = require("./unity_search_index");
const Texts = require("./langs.json");

require("dotenv").config();

function generateAnswer(item, context) {
	
	const title = item.isManual ? ("Manual:" + item.title) : item.title;

	const text =`<b>${title}</b>\n${item.summary}\n${item.url}`;

	return {
		type : "article",
		id : Number(item.id),
		title : item.title,
		description : item.summary,
		thumb_url: "https://upload.wikimedia.org/wikipedia/ru/a/a3/Unity_Logo.png",
		input_message_content : {
			message_text: text,
			disable_web_page_preview: true,
			parse_mode : "html"
		},
		url : item.url,
		hideUrl : true
	};
}

//@ts-ignore
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((context) => {
	const {language_code} = context.update.message.from;
	const pack = Texts[language_code] || Texts["en"];
	context.replyWithHTML(pack.hello);
});

bot.inlineQuery( async (query, middle) => {
	//trottling
	if(query.length < 3) {
		return;
	}
	
	const res = Unity.search(query);
	const result = res.map((e) => generateAnswer(e, middle));

	middle.answerInlineQuery( result, { cache_time: 10 });
});

/*
bot.action(/join:/, async (ctx, next) => {
  const game_id = +ctx.update.callback_query.data.replace("join:","");
  const chat = ctx.update.callback_query.chat_instance;
});
*/

bot.launch().then(() => {
	console.log("Bot started!");
});
