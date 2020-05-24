export type Message = {
  pos: number;
  end: number;
  content: string;
};

export class MessageBag {
  messages: Message[] = [];

  clear() {
    this.messages = [];
  }

  add(message: Message) {
    this.messages = [...this.messages, message];
  }
}
