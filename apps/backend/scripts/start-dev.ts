import { $ } from 'bun'

async function main() {
	await Promise.all([$`bun run dev`, $`bun run stripe:webhook`])
}

main()
