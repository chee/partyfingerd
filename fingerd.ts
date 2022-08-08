#!/usr/bin/env -S deno run --allow-net --allow-run
import { copy } from "https://deno.land/std@0.151.0/streams/conversion.ts"
const listener = Deno.listen({ port: 79 })
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const heart = Uint8Array.from([0x3c, 0x33])
const denial = encoder.encode("Finger forwarding service denied")

async function getLatestPost(post: string): Promise<Deno.Reader | null> {
	// TODO implement this command in deno
	const process = Deno.run({
		cmd: ["/bin/grab-post-as-text", post],
		stdout: "piped"
	})
	await process.status()
	return process.stdout
}

for await (const conn of listener) {
	try {
		const buffer = new Uint8Array(256)
		await conn.read(buffer)
		const user = decoder.decode(buffer)
			.replace(/\0.*/g,'')
			.trim()
		if (user.includes("@")) {
			// spec compliance
			// https://www.rfc-editor.org/rfc/rfc1288.html#section-3.2.1
			await conn.write(denial)
		} else {
			const stdout = await getLatestPost(user)

			if (stdout) {
				await copy(stdout, conn)
			} else {
				await conn.write(heart)
			}
		}
	} finally {
		conn.close()
	}

}
