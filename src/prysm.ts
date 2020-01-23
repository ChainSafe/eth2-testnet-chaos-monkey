import fs from "fs";

interface IPrysmKeyFormat {
    validator_key: string;
}

function generateKeys(numKeys: number): IPrysmKeyFormat[] {
    const arr = new Array(numKeys);
    return arr
        .fill(0)
        .map((_, i) => {
            const key = i;
            return { validator_key: key.toString() }
        })
}

function createPrysmJsonFile(keys: IPrysmKeyFormat[]): void {
    const data = JSON.stringify({ keys });
    fs.writeFileSync(`./keys/prysm/${Date.now()}.json`, data);
}

function main(): void {
    const keys = generateKeys(2);
    createPrysmJsonFile(keys);
}

main();