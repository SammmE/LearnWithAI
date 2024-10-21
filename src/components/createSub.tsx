import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { info } from "@tauri-apps/plugin-log";
import { addSubject } from "@/utils/backend";
import { toast } from "sonner";

export const createSubjectSchema = z.object({
    name: z
        .string()
        .min(3, { message: "name must be at least 3 characters long" })
        .max(25, { message: "name must be shorter than 25 characters" }),
    description: z
        .string()
        .max(255, { message: "name must be shorter than 255 characters" }),
});

export function CreateSubjectForm({ finishCallback }: { finishCallback: (id: Promise<number>) => any }) {
    const form = useForm<z.infer<typeof createSubjectSchema>>({
        resolver: zodResolver(createSubjectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    })

    function onSubmit(values: z.infer<typeof createSubjectSchema>) {
        info(`Creating subject with values: ${values}`);
        toast("Creating subject... This may take a moment to create the model.");
        const id = addSubject(values.name, values.description);
        finishCallback(id);
        toast("Subject created successfully.");
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 m-10">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter a name for this subject" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is your public display name.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter a description for this subject" {...field} />
                            </FormControl>
                            <FormDescription>
                                Provide a brief description of this subject.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}
