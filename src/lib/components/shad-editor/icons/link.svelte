<script lang="ts">
	import { type Editor } from "@tiptap/core";
	import { Link, Unlink , ChevronDown } from "lucide-svelte";
	
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";

	let { editor }: { editor: Editor } = $props();

	function setLink(url: string) {
	    if (url.trim() === "") {
	        editor.chain().focus().extendMarkRange("link").unsetLink().run();
	        return;
	    }
	    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Popover.Root>
				<Popover.Trigger>
					<Button
						variant="ghost"
						size="sm"
						class={cn("h-8", editor.isActive("link") && "bg-muted")}
					>
						<Link />
						<ChevronDown class="size-3! text-muted-foreground" />
					</Button>
				</Popover.Trigger>
				<Popover.Content class="bg-popover shadow-lg">
					<Input
						placeholder="Enter link to attach.."
						value={editor?.getAttributes("link").href}
						onchange={(e) => {
						    //@ts-ignore
						    if (e !== null && e.target !== null) setLink(e.target.value);
						}}
						class="w-full"
						type="url"
					/>
					<div class="flex items-center justify-between gap-2 mt-4">
						<Button
							variant="outline"
							class="text-red-500"
							size="icon"
							onclick={() => {
							    editor.chain().focus().extendMarkRange("link").unsetLink().run();
							}}>
							<Unlink />
						</Button>
						<Button onclick={() => {}}>
							<Popover.Close>Insert</Popover.Close>
						</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Add Or Remove Link</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
