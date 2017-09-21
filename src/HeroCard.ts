import {AbstractConverter} from './AbstractConverter';
import { Activity as DirectLineActivity } from "botframework-directlinejs";

export class HeroCard implements AbstractConverter {
    public lineToDirectLine (event: Line.WebhookEvent): DirectLineActivity{
        return {} as DirectLineActivity;
    }

    public DirectLineToLine (event: DirectLineActivity): Line.Message {
        let attachment = event.attachments[0];
        let attachmentType = event.contentType;
        let content = attachment.content;
        let buttons = content.buttons;
        let lineButtons = [];

        for (const button of buttons) {
            lineButtons.push({
                "type": "message",
                "label": buttons.title,
                "text": buttons.value
            })
        }

        const lineMessage:Line.Message = {
            "type": "template",
            "altText": event.text,
            "template": {
              "type": "buttons",
              "title": "Menu",
              "text": "Please select",
              "actions": lineButtons
            }
        }

        return lineMessage;
    }
}