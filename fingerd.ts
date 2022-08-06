#!/usr/bin/env -S deno run --allow-net --allow-run
import { copy } from "https://deno.land/std@0.151.0/streams/conversion.ts"
const listener = Deno.listen({ port: 79 })
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const heart = Uint8Array.from([0x3c, 0x33])
const dashes = "\n" + "*".repeat(72) + "\n\n"
const welcome = encoder.encode(dashes)
const goodbye = encoder.encode(dashes + "see more at https://chee.party/")

async function getLatestPost(post: string): Promise<Deno.Reader | null> {
	// TODO implement this command in deno
	const process = Deno.run({
		cmd: ["/bin/grab-post-as-text", post],
		stdout: "piped"
	})
	await process.status()
	return process.stdout
}

let close = (conn: Deno.Conn) => conn.close()

for await (const conn of listener) {
	try {
		const buffer = new Uint8Array(256)
		await conn.read(buffer)
		const user = decoder.decode(buffer)
			.replace(/\0.*/g,'')
			.trim()
		const stdout = await getLatestPost(user)
		// i don't know a better way of throwing everything away

		await conn.write(welcome)
		if (stdout) {
			await copy(stdout, conn)
		} else {
			await conn.write(heart)
		}
		await conn.write(goodbye)
	} finally {
		conn.close()
	}

}
