import "@/App.css";
import Layout from "@/components/layout";

function Home() {
    return (
        <Layout>
            <div className="flex min-h-screen">
                <div className="flex-grow p-4" style={{ flexBasis: "80%" }}>
                    <h1>Left side content</h1>
                </div>
                <div className="w-1/5 p-4 ml-auto">
                    <h1>Right side content</h1>
                </div>
            </div>
        </Layout>
    );
}

export default Home;
