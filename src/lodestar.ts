import fs from "fs";
import {IPrysmKeyFormat} from "./prysm";

function parsePrysm(path: string): string[] {
    const jsonString = fs.readFileSync(path, "utf8");
    const { keys } = JSON.parse(jsonString);
    return keys.map((key: IPrysmKeyFormat) => { return (new Buffer(key.validator_key, "base64")).toString("hex") });
}

function convertPrysmToLodestar(signingPath: string, withdrawalPath: string): void {
    const signing = parsePrysm(signingPath);
    const withdrawal = parsePrysm(withdrawalPath);
    const zipped = signing.map((key: string, i: number) => {
        process.stdout.clearLine(0);  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write(String(i));
        return {
            signing: key,
            withdrawal: withdrawal[i]
        }
    });
    const data = JSON.stringify({ keys: zipped });
    fs.writeFileSync(`./keys/lodestar/bls-${Date.now()}.json`, data);
}

(async function main() {
    convertPrysmToLodestar(process.argv[2], process.argv[3]);
})()