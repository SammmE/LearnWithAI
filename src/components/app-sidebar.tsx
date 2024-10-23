import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"

import { ModeToggle } from "./mode-toggle"
import React from "react";
import { getSubjects } from "@/utils/backend";
import type { SubjectSignature } from "@/utils/classes";
import { Button } from "./ui/button";
import { SubjectLoader } from "@/utils/loader";
import { CreateSubjectForm } from "./createSub"
import { info } from "@tauri-apps/plugin-log"

interface SearchResults {
    subject: SubjectSignature;
    distance: number;
}

function SubjectDescriptionLoader({ subjectId }: { subjectId: number }) {
    const [description, setDescription] = React.useState<string>("");

    React.useEffect(() => {
        SubjectLoader.getInstance().loadSubject(subjectId).then((subject) => {
            setDescription(subject.getDescription());
        });
    }, [subjectId]);

    return <p>{description}</p>;
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize the first row and column
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Populate the matrix with the Levenshtein distance values
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;

            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // Deletion
                matrix[i][j - 1] + 1,      // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return matrix[b.length][a.length];
}

function search(subjects: SubjectSignature[], query: string, resultLength = -1): SubjectSignature[] {
    if (query === "") {
        return subjects;
    }

    // order subjects by this:
    // 1. Exact match
    // 2. starts with
    // 3. levenshtein distance

    const results: SearchResults[] = [];
    for (const subject of subjects) {
        if (subject.name.toLowerCase() === query.toLowerCase()) {
            results.push({ subject: subject, distance: 0 });
        } else if (subject.name.toLowerCase().startsWith(query.toLowerCase())) {
            results.push({ subject: subject, distance: 1 });
        } else {
            results.push({ subject: subject, distance: levenshteinDistance(subject.name.toLowerCase(), query.toLowerCase()) });
        }
    }

    results.sort((a, b) => a.distance - b.distance);

    const subjectsResults: SubjectSignature[] = [];
    for (const result of results) {
        subjectsResults.push(result.subject);
        if (resultLength !== -1 && subjectsResults.length >= resultLength) {
            break;
        }
    }

    return subjectsResults;
}

export function AppSidebar() {
    const [subjects, setSubjects] = React.useState<SubjectSignature[]>([]);
    const [searchQuery, setSearchQuery] = React.useState<string>("");
    const [isCreateSub, setIsCreateSub] = React.useState<boolean>(false);

    // biome-ignore lint/correctness/useExhaustiveDependencies: ion like ts
    React.useEffect(() => {
        info("Grabbing subjects...");
        getSubjects().then((data) => {
            setSubjects(data);
            info(`${subjects.length} subjects loaded.`);
        });
    }, []);

    return (
        <Sidebar className="rounded-r-lg">
            <SidebarHeader className="ubuntu-bold"><h1 className="text-3xl">Learn With AI</h1></SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <Input placeholder="Search for Subjects" onChange={(event) => {
                        setSearchQuery((event.target as HTMLInputElement).value);
                    }} />
                </SidebarGroup>
                <SidebarGroup>
                    <div className="flex flex-col items-center space-y-4">
                        {search(subjects, searchQuery, 6).map((subject) => (
                            <HoverCard key={subject.id}>
                                <HoverCardTrigger>
                                    <Button className="text-center min-w-48" onClick={() => { SubjectLoader.getInstance().setPrimary(subject.id) }}>{subject.name}</Button>
                                </HoverCardTrigger>
                                <HoverCardContent>
                                    <p>{subject.description}</p>
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                    </div>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center space-x-2">
                    <ModeToggle />
                    <Dialog open={isCreateSub} onOpenChange={(open: boolean) => { setIsCreateSub(open) }}>
                        <Button className="w-full" onClick={() => { setIsCreateSub(true) }}>Create Subject</Button>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create a new Subject</DialogTitle>
                                <CreateSubjectForm finishCallback={() => {
                                    setIsCreateSub(false);
                                    info("Grabbing subjects...");
                                    getSubjects().then((data) => {
                                        setSubjects(data);
                                        info(`${subjects.length} subjects loaded.`);
                                    });
                                }} />
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
