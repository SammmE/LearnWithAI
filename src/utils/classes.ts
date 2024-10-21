import ollama from "ollama";

class Subject {
    private id: number;
    private name: string;
    private conversations: Message[];
    private cards: Flashcard[];
    private desc: string;

    constructor(id: number, name: string, desc: string) {
        this.id = id;
        this.name = name;
        this.conversations = [];
        this.cards = [];
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

    // utilities
    public async sendMessage(message: Message): Promise<any> {
        this.conversations.push(message);

        // turn conversations into ollama messages (array of { role: '', content: '' })
        const ollama_msgs = this.conversations.map((msg) => {
            return {
                role: msg.sender,
                content: msg.content,
            };
        });

        const response = await ollama.chat({
            model: "llama3.1",
            messages: ollama_msgs,
            stream: true,
        });

        return response;
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
            content: `Create flascards for this prompt: ${prompt}. Flashcards will be generated with this formula: question: {question here}, answer: {answer here}\n question: {question here}, answer: {answer here}. Follow all instructions closely! Remember: there should be no extra spaces or characters in the prompt other than the flashcards. The question and answer should be inside the curly braces. Anything outside of the curly braces will be ignored.`,
        });

        const response = await ollama.chat({
            model: "llama3.1",
            messages: ollama_msgs,
        });

        // parse response into flashcards
        // look for the question keyword, and if it is followed by a colon, then it is a question.
        // repeat for answer
        // store as flashcard, then repeat until no more questions or answers are found
        const flashcards: Flashcard[] = [];
        var questions_reg = response.message.content.match(/question: {.*?}/g);
        var answers_reg = response.message.content.match(/answer: {.*?}/g);

        const min = Math.min(
            questions_reg?.length ?? 0,
            answers_reg?.length ?? 0
        );
        const questions = questions_reg?.slice(0, min) ?? [];
        const answers = answers_reg?.slice(0, min) ?? [];

        for (let i = 0; i < questions.length; i++) {
            // remove first 11 characters and last character
            const question = questions[i].slice(11, -1);
            const answer = answers[i].slice(9, -1);
            flashcards.push({
                id: this.cards.length + i,
                question: question,
                answer: answer,
            });
        }

        this.cards = this.cards.concat(flashcards);

        return flashcards;
    }

    public addFlashcard(flashcard: Flashcard): void {
        this.cards.push(flashcard);
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
