import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SubjectLoader } from "@/utils/loader";

function Flashcard({ question, answer }: { question: string, answer: string }) {
    const [flipped, setFlipped] = useState<boolean>(false);

    return (
        <Card className="mt-3 flashcard" onClick={() => {
            setFlipped(!flipped);
        }}>
            <CardHeader className="mt-5 ml-2 mr-2">
                <CardTitle>{flipped ? answer : question}</CardTitle>
            </CardHeader>
            <CardContent className="m-1">
                <p>{flipped ? "Click to see the question" : "Click to reveal answer"}</p>
            </CardContent>
        </Card>
    )
}

export default function Flashcards() {
    const [cards, setCards] = useState<{ question: string, answer: string, id: number }[]>([]);

    SubjectLoader.getInstance().registerPrimaryChangeCallback(() => {
        SubjectLoader.getInstance().getPrimary().then((sub) => {
            setCards(sub.getFlashcards());

            sub.addFlashcardChangeCallback((cards) => {
                setCards(cards);
            });
        });
    });

    return (
        <div className="border-l-2 flex flex-col h-screen">
            <h1 className="text-xl font-bold ubuntu-bold text-center self-center mx-auto mt-4 ml-2">Flashcards</h1>
            <div className="mt-5 ml-2 flex-grow overflow-y-auto h-0">
                {cards.map((card) => (
                    <Flashcard key={card.id} question={card.question} answer={card.answer} />
                ))}
            </div>
        </div>
    );
}