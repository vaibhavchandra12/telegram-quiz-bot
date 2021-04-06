const Telegraf = require('telegraf');
var fs = require("fs");
const bot = new Telegraf("1682034994:AAEePtja-TYpt-P1cMkmA0Y4KWBTl-i4XGY")

const Timeouts = {
    HELLO: 1000,
    GET_READY: 2000,
    QUESTION: 30000,
    NEXT_QUESTION: 25000,
    SCOREBOARD_TIMEOUT: 15000
}

var questions = [];
var players = [];
var chat_id = -366641537; // CHAT ID
var isGameOn = false;
var current_question = undefined;
var questionNumber = -1;
var isQuestionActive = false;
var scoreboardHasExpired = true;
var questionTimeout = undefined;

bot.command('scoreboard', ScoreBoardCommandHandler);
bot.use(async (ctx, next) => {
    if (isGameOn) {
        console.log("nextt");
        next();
    } else {
        console.log("yuttumm");
    }
});
bot.command("Join", PlayerCatcher);
bot.command("join", PlayerCatcher);
bot.hears(GameLogic);
bot.on("error", er => { console.log(er); })
bot.startPolling();

Initiate();


function Initiate() {
    fs.readFile("questions.json", 'utf-8', function (err, content) {
        if (err) {
            console.log("Dosya okunamadı", err);
            return;
        }
        questions = JSON.parse(content);
        if (!questions.length) {
            console.log("soru yok!!"); return;
        }
        StartGame();
    });
}

function StartGame() {
    isGameOn = true;
    setTimeout(
        () => {
            SendMessage(`Hi all, The race is about to start soon. Get ready and don't make a flute(${Timeouts.NEXT_QUESTION/1000}second)`);
            SendMessage("Please type / join to enter the Contest");
            NextQuestion();
        }
        , Timeouts.HELLO);

}

function EndGame() {
    SendMessage("Quizzz Over");
    ScoreBoard();
    questionNumber = -1;
    isGameOn = false;
    isQuestionActive = false;
}
function QuestionTimeout() {
    SendMessage(`Nobody could answer the question :(:(\n Cevap "${current_question.answers[0]}" olacaktı`);
    isQuestionActive = false;
    NextQuestion();
}
function SendMessage(message) {
    bot.telegram.sendMessage(chat_id, `▶️${message}`, { parse_mode: 'Markdown' });
}
function NextQuestion() {
    questionNumber = questionNumber + 1;
    if (questionNumber == questions.length) {
        EndGame();
        return;
    }
    SendMessage(`${questionNumber + 1}. Soru Geliyor Hazırlan!!!`);
    setTimeout(() => {
        current_question = questions[questionNumber];
        SendMessage(`✨Question ${questionNumber + 1} (${current_question.point} Point)✨\n >>> *${current_question.question}*`);
        isQuestionActive = true;
        questionTimeout = setTimeout(QuestionTimeout, Timeouts.QUESTION);
    }, Timeouts.NEXT_QUESTION);
}
function PlayerCatcher(ctx) {
    var from = ctx.message.from;
    if (!players.filter(p => p.id == from.id).length) {
        var new_player = {
            id: from.id,
            first_name: from.first_name,
            last_name: from.last_name,
            username: from.username,
            point: 0
        };
        console.log("new player added", new_player.username);
        SendMessage(`[${new_player.first_name}](tg://user?id=${new_player.id}) yarışa katıldı !`);
        players.push(new_player);
    }
};
function GameLogic(prediction, ctx) {
    console.log(prediction, ctx.message);
    const index = players.findIndex(p => p.id == ctx.message.from.id);
    if (isGameOn && isQuestionActive && index != -1) {
        if (current_question.answers.map(l=>l.toLowerCase()).indexOf(prediction.trim().toLowerCase()) != -1) {
            clearTimeout(questionTimeout);
            isQuestionActive=false;
            const index = players.findIndex(p => p.id == ctx.message.from.id);
            players[index].point = players[index].point + current_question.point;
            var message = `👏👏Congratulations [${players[index].first_name}](tg://user?id=${players[index].id})  ${current_question.point} You earned points !!👏👏`;
            SendMessage(message);
            NextQuestion();
        }
    }
};
function ScoreBoard() {
    var sortedList = players.sort((a, b) => b.point - a.point);
    var scoreBoardMessage = sortedList.map((row, i) => {
        var username = `[${row.first_name}](tg://user?id=${row.id})`;
        text = `${i + 1}-\t${username}\t_${row.point} Point_`;
        return text;
    }).join("\n").replace('1', '🏆');
    SendMessage(scoreBoardMessage);
    scoreboardHasExpired = false;
    setTimeout(() => scoreboardHasExpired = true, Timeouts.SCOREBOARD_TIMEOUT);
}
function ScoreBoardCommandHandler(ctx) {
    if (scoreboardHasExpired) {
        ScoreBoard();
    }
    else {
        SendMessage("_!!Flüt yapmayın!!_");
    }
}

