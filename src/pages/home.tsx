import "@/App.css";
import Layout from "@/components/layout";
import { Chat } from "@/components/chat";

function Home() {
    return (
        <Layout>
            <div className="flex w-full">
                <div className="flex-grow p-4" style={{ flexBasis: "80%" }}>
                    <Chat />
                </div>
                <div className="w-1/5 p-4 ml-auto">
                    <h1>Right side content</h1>
                </div>
            </div>
        </Layout>
    );
}

export default Home;
