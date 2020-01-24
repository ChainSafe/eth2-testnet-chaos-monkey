require("dotenv").config();
import fs from "fs";
import {
    generateRandomSecretKey,
    deriveKeyFromMnemonic,
    deriveKeyFromEntropy,
    deriveKeyFromMaster,
    IEth2ValidatorKeys,
    deriveEth2ValidatorKeys,
} from "@chainsafe/bls-keygen";
import { SigningKey } from "ethers/utils";

interface IPrysmKeyFormat {
    validator_key: string;
}

function generateKeys(numKeys: number, startingPoint: number, mnemonic?: string): IEth2ValidatorKeys[] {
    const masterSecretKey = deriveKeyFromMnemonic(mnemonic || process.env.defaultMnemonic);
    const arr = new Array(numKeys);
    return arr
        .fill(0)
        .map((_, i) => {
            const index = i + startingPoint;
            process.stdout.clearLine(0);  // clear current text
            process.stdout.cursorTo(0);  // move cursor to beginning of line
            process.stdout.write(String(index));
            return deriveEth2ValidatorKeys(masterSecretKey, index);
        })
}

function createPrysmJsonFile(eth2keys: IEth2ValidatorKeys[]): void {
    const keys = eth2keys.map((k) => {
        return {validator_key: k.signing.toString("base64")};
    });
    const data = JSON.stringify({ keys });
    fs.writeFileSync(`./keys/prysm/${Date.now()}.json`, data);
}

(async function main(): Promise<void> {
    const keys = generateKeys(2, 0);
    createPrysmJsonFile(keys);
})();