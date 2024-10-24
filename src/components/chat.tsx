import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { SendHorizonal } from 'lucide-react';
import { info } from '@tauri-apps/plugin-log';
import { useEffect, useState } from 'react';
import { SubjectLoader } from '@/utils/loader';
import { LoadingSpinner } from './ui/LoadingSpinner';


function PersonMessage({ message }: { message: string }) {
    return (
        <Card className="mb-4">
            <div className="flex items-center space-x-4">
                <Avatar className='m-3'>
                    <AvatarImage src={"/person.png"} />
                    <AvatarFallback>User</AvatarFallback>
                </Avatar>

                <div>
                    <p className="font-semibold">You</p>
                    <p>{message}</p>
                </div>
            </div>
        </Card>
    );
}

function AiMessage({ message }: { message: string }) {
    return (
        <Card className="mb-4">
            <div className="flex items-center space-x-4">
                <Avatar className='m-3'>
                    <AvatarImage src={"/walle.jpg"} />
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>

                <div>
                    <p className="font-semibold">AI</p>
                    <p>{message}</p>
                </div>
            </div>
        </Card>
    );
}

export const Chat = () => {
    const [messages, setMessages] = useState<{ id: number; sender: string; content: string }[]>([]);
    const [subjectTitle, setSubjectTitle] = useState<string>("Select a subject to start chatting");
    const [aiSend, setAiSend] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [send, setSend] = useState<string>('');

    SubjectLoader.getInstance().registerPrimaryChangeCallback(() => {
        SubjectLoader.getInstance().getPrimary().then((sub) => {
            setSubjectTitle(sub.getName());
            setMessages(sub.getMessages());
            info(JSON.stringify(sub));

        });
        setAiSend("");
    })

    const sendMessage = () => {
        info("sending message to primary subject");
        setMessages((prev) => [...prev, { id: prev.length, sender: 'user', content: send }]);
        setSend('');
        setLoading(true);
        SubjectLoader.getInstance().getPrimary().then((sub) => {
            sub.sendMessage({ id: 0, sender: 'user', content: send }, (chunk) => {
                setAiSend(chunk);
            }).then((res) => {
                // load flashcards
                sub.parseFlashcards(res).then((cards) => {
                    info(`flashcards parsed: ${JSON.stringify(cards)}`);
                });

                // remove the content betweem <<< and >>> from the message
                setMessages((prev) => [...prev, { id: prev.length, sender: 'ai', content: res.replace(/<<<.*>>>/, "") }]);

                setLoading(false);
                setAiSend('');
                SubjectLoader.getInstance().savePrimary();
                sub.parseFlashcards(res);
            });
        });
    };

    useEffect(() => {
        info("getting messages from primary subject");
        SubjectLoader.getInstance().getPrimary().then((sub) => {
            const messages = sub.getMessages().map((msg: { id: number; sender: string; content: string }) => ({
                ...msg,
                sender: msg.sender === 'user' ? 'user' : 'ai'
            }));
            return setMessages(messages);
        });
    }, []);

    return (
        <div className="flex flex-col h-screen">
            <h1 className="text-2xl font-bold ubuntu-bold text-center self-center mx-auto mt-4">{subjectTitle}</h1>

            <div className="flex-grow overflow-y-scroll p-4">
                {messages.map((msg) => msg.sender === 'user' ? <PersonMessage key={msg.id} message={msg.content} /> : <AiMessage key={msg.id} message={msg.content} />)}
                {aiSend && <AiMessage message={aiSend} />}
                <div className='flex'>
                    {loading && <LoadingSpinner />}
                    <p>{loading && aiSend.indexOf("<<<") !== -1 ? "detected flashcard" : ""}</p>
                </div>
            </div>
            <div className='sticky bottom-0 p-4'>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="w-full p-2 text-black rounded-lg"
                        onChange={(e) => {
                            setSend(e.target.value);
                        }}
                        disabled={subjectTitle === "Select a subject to start chatting" || loading}
                        value={send}
                        onKeyUp={(e) => { if (e.key === 'Enter' || e.keyCode === 13) { sendMessage() } }} // keycode for legacy browsers (who knows?)
                    />
                    <Button disabled={subjectTitle === "Select a subject to start chatting" || loading} onClick={() => sendMessage()} className='ml-1' size={"icon"}><SendHorizonal /></Button>
                </div>
            </div>
        </div>
    );
};

export default Chat;