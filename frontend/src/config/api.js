const rawApiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Recover from accidental pasted mask characters (e.g. bullets) before URL.
const normalizedApiBase = rawApiBase
	.trim()
	.replace(/^.*?(https?:\/\/)/i, '$1')
	.replace(/\/+$/, '');

const API_BASE = normalizedApiBase || 'http://localhost:5000';

export default API_BASE;