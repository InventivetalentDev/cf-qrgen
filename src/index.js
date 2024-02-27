// based on https://developers.cloudflare.com/workers/tutorials/build-a-qr-code-generator/

const qr = require("qr-image");

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

/**
 * @param request {Request}
 * @returns {Promise<Response>}
 */
async function generateQRCode(request) {
	let data = {
		text: "https://workers.dev",
		size: 5,
		margin: 4
	}

	const url = new URL(request.url)

	if (url.searchParams.has("text")) {
		data.text = url.searchParams.get("text").substring(0, 512);
	}
	if (url.searchParams.has("size")) {
		data.size = clamp(parseInt(url.searchParams.get("size")), 1, 20);
	}
	if (url.searchParams.has("margin")) {
		data.margin = clamp(parseInt(url.searchParams.get("margin")), 0, 10);
	}

	const headers = {"Content-Type": "image/png"}
	for (const k in data) {
		headers[`x-qr-${k}`] = data[k]
	}

	const qr_png = qr.imageSync(data.text, {
		size: data.size,
		margin: data.margin
	})
	return new Response(qr_png, {headers})
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		if (url.pathname === "/qr") {
			return generateQRCode(request)
		}

		return new Response(landing, {
			headers: {
				"Content-Type": "text/html"
			}
		})


	},
};

const landing = `
<h1>QR Generator</h1>
<input type="text" id="text" value="https://workers.dev"></input>
<button onclick="generate()">Generate QR Code</button>
<br/>
<img id="qr" src="#" />
<script>
	function generate() {
		fetch("/qr?text=" + document.querySelector("#text").value)
		.then(response => response.blob())
		.then(blob => {
			const reader = new FileReader();
			reader.onloadend = function () {
				document.querySelector("#qr").src = reader.result; // Update the image source with the newly generated QR code
			}
			reader.readAsDataURL(blob);
		})
	}
</script>
`
