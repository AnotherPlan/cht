// Make requests to CryptoCompare API
export async function makeApiRequest(path) {
	try {
		const response = await fetch("https://api.la-bit.com/chart", {
			method: "POST",
			headers: {
			  "Content-Type": "application/json",
			},
			body: JSON.stringify(path),
		  })
		return response.json();
	} catch (error) {
		throw new Error(`CryptoCompare request error: ${error.status}`);
	}
}

// Generate a symbol ID from a pair of the coins
export function generateSymbol(exchange, fromSymbol, toSymbol) {
	const short = `${fromSymbol}${toSymbol}`;
	return {
		short,
		full: `${exchange}:${short}`,
	};
}

export function parseFullSymbol(fullSymbol) {
	const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
	if (!match) {
		return null;
	}

	return {
		exchange: match[1],
		Symbol: match[2],
	};
}
