import { Client, middleware, validateSignature } from "@line/bot-sdk";
import { Middleware } from "@line/bot-sdk/dist/middleware";
import { DirectLine, Message as DirectLineMessage } from "botframework-directlinejs";
import * as restify from "restify";
import * as restifyPlugins from "restify-plugins";
import { HeroCard } from "./HeroCard";

const XMLHttpRequest = require("xhr2");
global = Object.assign(global, { XMLHttpRequest });

const logger = console;
const directLine = new DirectLine({
  secret:
    // process.env.DIRECT_LINE_SECRET
    // "8H_E4uG1JPI.cwA.7R0.75PQaEeOKu9rZOKqsZRTx0DX5apb75tIC0szEodaLgc" // Evan's
    // "kMVxrgDSM6w.cwA.Bnw.RPkFc8hVzG6hk_JFJ4ke3U0lmo2krScd4h7IqI2w4XI" // saki's
    "OnGtSpm77Zk.cwA.4sA.P8PplL_rpZU1fOOK_QCyd6U9U8G278cG1JWaJ7-8Ob4"
});

/**
 * Map conversation ID to user ID
 */
const conversations:Map<string, string> = new Map();

const server = restify.createServer();
server.use(restifyPlugins.bodyParser({}));

server.listen(process.env.port || process.env.PORT || 9998 || 3978, () => {
  logger.log("%s listening to %s", server.name, server.url);
});

const lineConfig: Line.ClientConfig & Line.MiddlewareConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
  channelSecret: process.env.LINE_CHANNEL_SECRET as string
};

const lineClient = new Client(lineConfig);

const endpoint = "/line";
server.post(endpoint, async (req, res) => {
  if (Array.isArray(req.body.events)) {
    for (const event of req.body.events) {
      switch (event.type) {
        case "message":
          const activity: DirectLineMessage = {
            from: {
              id: event.replyToken,
              name: event.source.userId // TODO:figure out the user's name.
            },
            text: event.message.text,
            type: "message"
          };
          logger.log("posting activity", activity);
          directLine.postActivity(activity).subscribe(
            messageId => {
              const conversationId = messageId.split("|")[0];
              // conversations[id] = event.replyToken || "";
              conversations.set(conversationId, event.source.userId);
              logger.log("Posted activity, assigned ID ", messageId);
            },
            error => logger.error("Error posting activity", error)
          );
          break;
        case "follow":
          logger.log("follow");
          break;
        case "unfollow":
          logger.log("unfollow");
          break;
        default:
          res.send(404);
          break;
      }
    }
  }
});

directLine.activity$
  // .filter(activity => activity.type === "message" && activity.from.id === "yourBotHandle")
  // .filter(activity => activity.type === "message")
  .subscribe((message: DirectLineMessage) => {
    logger.log("received message ", message);

    logger.log(message.attachments);

    let lineMessage: Line.Message;

    if (!message.attachments) {
      lineMessage = {
        text: message.text,
        type: "text"
      };
    } else {
      let attachment = message.attachments[0];
      let attachmentType = attachment.contentType;

      switch (attachmentType) {
        case "application/vnd.microsoft.card.hero":
          const heroClass = new HeroCard();
          lineMessage = heroClass.DirectLineToLine(message);
          break;
      }
    }

    if (message.conversation && message.conversation.id) {
      lineClient
        .pushMessage(conversations.get(message.conversation.id), lineMessage)
        .then(() => {
          logger.log("Replied with", lineMessage);
        })
        .catch((err: Error) => {
          logger.error(err.message);
        });
    }
  });