let valid_characters = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9'
];

export function validatePoktAddress(pokt_address: string) {
	if (pokt_address.length != 40) {
		return false;
	}
	for (var i = 0; i < pokt_address.length; i++) {
		if (valid_characters.includes(pokt_address[i].toLowerCase())) {
			continue;
		} else {
			return false;
		}
	}
	return true;
}
