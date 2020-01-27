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

export interface IPrysmKeyFormat {
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
    let keys = eth2keys.map((k) => {
        return {validator_key: k.signing.toString("base64")};
    });
    let data = JSON.stringify({ keys });
    fs.writeFileSync(`./keys/prysm/signing-${Date.now()}.json`, data);

    keys = eth2keys.map((k) => {
        return { validator_key: k.withdrawal.toString("base64") };
    });
    data = JSON.stringify({ keys });
    fs.writeFileSync(`./keys/prysm/withdrawal-${Date.now()}.json`, data);
}

(async function main(): Promise<void> {
    const keys = generateKeys(Number(process.argv[2]), 0);
    console.log(keys[0].signing.toString("hex"));
    // createPrysmJsonFile(keys);
})();