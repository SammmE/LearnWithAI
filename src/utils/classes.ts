import { info } from "@tauri-apps/plugin-log";
import ollama from "ollama/browser";

class Subject {
    private id: number;
    private name: string;
    private conversations: Message[];
    private cards: Flashcard[];
    private desc: string;
    private flashcardChangeCallbacks: ((flashcards: Flashcard[]) => void)[] =
        [];

    constructor(
        id: number,
        name: string,
        desc: string,
        conversations: Message[] = [],
        cards: Flashcard[] = []
    ) {
        this.id = id;
        this.name = name;
        this.conversations = conversations;
        this.cards = cards;
        this.desc = desc;
    }

    // Getters & Setters
    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getMessages(): Message[] {
        return this.conversations;
    }

    public getFlashcards(): Flashcard[] {
        return this.cards;
    }

    public getDescription(): string {
        return this.desc;
    }

    public addFlashcardChangeCallback(
        callback: (flashcards: Flashcard[]) => void
    ): void {
        this.flashcardChangeCallbacks.push(callback);
    }

    // utilities
    public async sendMessage(
        message: Message,
        textUpdate: (chunk: string) => void
    ): Promise<string> {
        info(`sending message to ${this.name}-${this.id}`);
        this.conversations.push(message);

        // turn conversations into ollama messages (array of { role: '', content: '' })
        const ollama_msgs = this.conversations.map((msg) => {
            return {
                role: msg.sender,
                content: msg.content,
            };
        });

        const responseIterator = await ollama.chat({
            model: `${this.name.replace(" ", "").slice(0, 3)}-${this.id}`,
            messages: ollama_msgs,
            stream: true,
        });

        let res = "";

        for await (const response of responseIterator) {
            res += response.message.content;
            textUpdate(res);
        }

        // add AI response to conversation
        this.conversations.push({
            id: this.conversations.length,
            sender: "ai",
            content: res.replace(/<<<.*>>>/, ""),
        });

        return res;
    }

    public addMessageAI(message: Message): void {
        this.conversations.push(message);
    }

    public async generageFlashcards(prompt: string): Promise<Flashcard[]> {
        const ollama_msgs = this.conversations.map((msg) => {
            return {
                role: msg.sender,
                content: msg.content,
            };
        });

        ollama_msgs.push({
            role: "user",
            content: `Create flascards for this prompt: ${prompt}. Flashcards will be generated with this formula: <<<[{"question": "what is 1 + 1", "answer": "2"}, {"question": "what is 2 + 2", "answer: "4"}]>>>. It needs to follow this json scheme and has to start with <<< and end with >>>"`,
        });

        const response = await ollama.chat({
            model: `${this.name.replace(" ", "").slice(0, 3)}-${this.id}`,
            messages: ollama_msgs,
        });

        return this.parseFlashcards(response.message.content);
    }

    public async parseFlashcards(prompt: string): Promise<Flashcard[]> {
        // parse flashcards
        const start = prompt.indexOf("<<<");
        const end = prompt.indexOf(">>>");
        const flashcardString = prompt.slice(start + 3, end);

        const flashcards = JSON.parse(flashcardString);
        const cards: Flashcard[] = [];

        for (const card of flashcards) {
            cards.push({
                id: this.cards.length,
                question: card.question,
                answer: card.answer,
            });
            this.addFlashcard(cards[cards.length - 1], false);
        }

        info(`Generated ${cards.length} flashcards`);

        for (const callback of this.flashcardChangeCallbacks) {
            callback(cards);
        }

        return cards;
    }

    public addFlashcard(flashcard: Flashcard, callback = true): void {
        this.cards.push(flashcard);
        if (callback) {
            for (const cb of this.flashcardChangeCallbacks) {
                cb(this.cards);
            }
        }
    }
}

export class SubjectSignature {
    id: number;
    name: string;
    description: string;

    constructor(id: number, name: string, description: string) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}

interface Message {
    id: number;
    sender: string;
    content: string;
}

interface Flashcard {
    id: number;
    question: string;
    answer: string;
}

export default Subject;
