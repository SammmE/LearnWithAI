import { info } from "@tauri-apps/plugin-log";
import { getSubject } from "./backend";
import Subject from "./classes";

// loads subjects. This class is built so that subjects won't be loaded multiple times. The subjects will also be cached up to 5 at a time.
export class SubjectLoader {
    static #instance: SubjectLoader;
    private loaded: Subject[] = [];
    private primaryChangeCallbacks: ((subject: number) => any)[] = [];
    private primary: number = 0;

    private constructor() {}

    public static getInstance(): SubjectLoader {
        if (!SubjectLoader.#instance) {
            SubjectLoader.#instance = new SubjectLoader();
        }
        return SubjectLoader.#instance;
    }

    public async loadSubject(subject: number): Promise<Subject> {
        if (this.loaded.find((s) => s.getId() === subject)) {
            info(`Subject with id ${subject} found in cache`);
            const foundSubject = this.loaded.find((s) => s.getId() === subject);
            if (!foundSubject) {
                throw new Error(`Subject with id ${subject} not found`);
            }
            return foundSubject;
        }

        return getSubject(subject).then((s: Subject) => {
            this.loaded.push(s);
            info(`Subject with id ${subject} loaded`);
            if (this.loaded.length > 5) {
                info(
                    "Removing oldest subject from cache to make room for new subject"
                );
                this.loaded.shift();
            }
            return s;
        });
    }

    public async getPrimary(): Promise<Subject> {
        return this.loadSubject(this.primary);
    }

    public async setPrimary(subject: number): Promise<void> {
        this.primary = subject;
        info(`Primary subject set to ${subject}`);

        if (!this.loaded.find((s) => s.getId() === subject)) {
            info(`Subject with id ${subject} not found in cache. Loading...`);
            this.loadSubject(subject);
        }

        this.primaryChangeCallbacks.forEach((callback) => callback(subject));
    }

    public async getSubjects(): Promise<Subject[]> {
        return this.loaded;
    }

    public async clearCache(): Promise<void> {
        this.loaded = [];
        info("Cache cleared");
    }

    public async removeSubject(subject: number): Promise<void> {
        this.loaded = this.loaded.filter((s) => s.getId() !== subject);
        info(`Subject with id ${subject} removed from cache`);
    }

    public async reloadSubject(subject: number): Promise<Subject> {
        return this.removeSubject(subject).then(() =>
            this.loadSubject(subject)
        );
    }

    public async registerPrimaryChangeCallback(
        callback: (subject: number) => any
    ): Promise<void> {
        this.primaryChangeCallbacks.push(callback);
    }
}
