import "@/App.css";
import Layout from "@/components/layout";
import { Chat } from "@/components/chat";
import Flashcards from "@/components/flashcards";

function Home() {
    return (
        <Layout>
            <div className="flex w-full">
                <div className="flex-grow p-4" style={{ flexBasis: "80%" }}>
                    <Chat />
                </div>
                <div className="w-1/5 p-4 ml-auto">
                    <Flashcards />
                </div>
            </div>
        </Layout>
    );
}

export default Home;
