import {
    mkdir,
    exists,
    readDir,
    readTextFile,
    writeTextFile,
    BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { debug, info } from "@tauri-apps/plugin-log";

import ollama from "ollama/browser";
import Subject, { SubjectSignature } from "./classes";
import { appConfigDir } from "@tauri-apps/api/path";

export async function getConfigDir(): Promise<string> {
    const confDir: string = await appConfigDir();
    debug(`Configuration directory: ${confDir}`);

    // make this directory if it doesn't exist
    if (confDir && !(await exists(confDir))) {
        info("Creating configuration directory.");
        await mkdir(confDir, { recursive: true });
    }

    return confDir;
}

export async function getSubjects(): Promise<SubjectSignature[]> {
    // each subject has a json file in the config directory
    const configDir = await getConfigDir();

    const subjects: SubjectSignature[] = [];
    const files = await readDir(configDir);
    debug(`${files.length} subjects found`);

    for (const file of files) {
        const id = Number.parseInt(file.name.split("-")[1].split(".")[0]);
        const sub = await getSubject(id);
        info(`Subject id: ${id}`);
        subjects.push(
            new SubjectSignature(id, sub.getName(), sub.getDescription())
        );
    }

    info("finished getting subjects");

    return subjects;
}

export async function getSubject(id: number): Promise<Subject> {
    const configDir = getConfigDir();

    const file = `${await configDir}/subject-${id}.json`;

    info(`Reading subject: ${id} at ${file}`);
    return readTextFile(file).then((data) => {
        info(`Subject data: ${data}`);
        const tempSub = JSON.parse(data);
        return new Subject(tempSub.id, tempSub.name, tempSub.desc);
    });
}

async function generateSubjectId(): Promise<number> {
    const subjects = await getSubjects();
    let id = 0;

    for (const subject of subjects) {
        if (subject.id > id) {
            id = subject.id;
        }
    }

    return id + 1;
}

export async function addSubject(name: string, desc: string): Promise<number> {
    const configDir = getConfigDir();

    const id = generateSubjectId();
    const file = `${await configDir}/subject-${await id}.json`;
    const data = JSON.stringify(new Subject(await id, name, desc));

    const modelfile = `
        FROM mistral
        SYSTEM "You are a teacher for ${name} subject. You can send messages to students and generate flashcards from the messages. You follow instructions very closely. You are also very good at teaching. You are very patient and you are very good at explaining things. Rather than giving the answer straight-up, you prefer to guide the students to the answer. You like to keep things short and understandable, but will give a long explanation when needed. Flashcards will be generated with this formula: <<<[{"question": "what is 1 + 1", "answer": "2"}, {"question": "what is 2 + 2", "answer: "4"}]>>>. It needs to follow this json scheme and has to start with <<< and end with >>>"
        `;

    info(`Creating model for subject: ${name} id: ${await id}`);
    // model name: first 3 letters of subject without spaces + id
    ollama.create({
        model: `${name.replace(" ", "").slice(0, 3)}-${await id}`,
        modelfile: modelfile,
    });

    info(`Adding subject: ${name} id: ${await id}`);
    writeTextFile(file, data, {
        baseDir: BaseDirectory.AppConfig,
    });

    return id;
}

export async function updateSubject(subject: Subject) {
    const configDir = getConfigDir();

    const file = `${await configDir}/subject-${subject.getId()}.json`;
    const data = JSON.stringify(subject);

    info(`Updating subject: ${subject.getName()} id: ${subject.getId()}`);
    writeTextFile(file, data, {
        baseDir: BaseDirectory.AppConfig,
    });
}
