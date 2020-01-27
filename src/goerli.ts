require("dotenv").config();
import fs from "fs";
import { utils, Wallet, ethers } from "ethers";

interface IGoerliKeys {
    address: string;
    privkey: string;
}

function generateKeys(numKeys: number, mnemonic?: string): IGoerliKeys[] {
    const masterNode = utils.HDNode.fromMnemonic(mnemonic || process.env.defaultMnemonic);
    const arr = new Array(numKeys);
    const base = masterNode.derivePath(`m/44'/60'/0'`);
    return arr
    .fill(0)    
    .map((_, i) => { 
        process.stdout.clearLine(0);  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write(String(i));
        const hd = base.derivePath(`${i}/0`);
        return {address: hd.address, privkey: hd.privateKey};
    })
}

function createGoerliJsonFile(keys: IGoerliKeys[]): void {
    const data = JSON.stringify({ keys });
    fs.writeFileSync(`./keys/goerli/${Date.now()}.json`, data);
}

async function distribute(keys: IGoerliKeys[]): Promise<void> {
    const provider = ethers.getDefaultProvider("goerli");
    const masterWallet = new Wallet(process.env.masterKey, provider);
    let baseNonce = await masterWallet.getTransactionCount();
    
    const failed: IGoerliKeys[] = [];
    
    keys.forEach(async (key: IGoerliKeys, i: number) => {
        let code = await provider.getCode(key.address);
        if (code !== '0x') { 
            // throw new Error('Cannot sweep to a contract'); 
            console.log(`${key.address} is a contract, cannot distribute to contract.`)
            return; 
        }

        // Normally we would let the Wallet populate this for us, but we
        // need to compute EXACTLY how much value to send
        let gasPrice = await provider.getGasPrice();

        // The exact cost (in gas) to send to an Externally Owned Account (EOA)
        let gasLimit = 21000;
        let value = utils.parseEther("32.0");

        try {
            let tx = await masterWallet.sendTransaction({
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                to: key.address,
                value,
                nonce: baseNonce + i
            });

            console.log('Sent in Transaction: ' + tx.hash);
            console.log('Sent 32 goerli eth to: ', key.address);
        } catch (e) {
            failed.push(key);
            console.log("Error distributing eth:", e)
        }
    })
    if (failed.length > 0) {
        const data = JSON.stringify({ keys: failed });
        fs.writeFileSync(`./keys/failed/distribute-${Date.now()}.json`, data);
    }
}

async function sweep(to: string, keys: IGoerliKeys[]): Promise<void> {
    const provider = ethers.getDefaultProvider("goerli");
    
    // Keep track of failed txs
    const failed: IGoerliKeys[] = [];

    keys.forEach(async (key: IGoerliKeys) => {
        const wallet = new Wallet(key.privkey, provider);
        
        let code = await provider.getCode(to);
        if (code !== '0x') {
            // throw new Error('Cannot sweep to a contract'); 
            console.log(`${to} is a contract, cannot sweep to contract.`)
            return;
        }

        // Get the current balance
        let balance = await wallet.getBalance();

        // Normally we would let the Wallet populate this for us, but we
        // need to compute EXACTLY how much value to send
        let gasPrice = await provider.getGasPrice();

        // The exact cost (in gas) to send to an Externally Owned Account (EOA)
        let gasLimit = 21000;

        // The balance less exactly the txfee in wei
        let value = balance.sub(gasPrice.mul(gasLimit))
        try {
            let tx = await wallet.sendTransaction({
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                to,
                value: value
            });
            console.log('Sent in Transaction: ' + tx.hash);
            console.log(`Swept ${value} goerli eth to: `, to);
        } catch (e) {
            failed.push(key)
            console.log(e);
        }
    })
    if (failed.length > 0) {
        const data = JSON.stringify({ keys: failed });
        fs.writeFileSync(`./keys/failed/sweep-${Date.now()}.json`, data);
    }
}

(async function main() {
    const keys = generateKeys(Number(process.argv[2]));
    // await distribute(keys);
    // await sweep(process.env.masterPub, keys);
    createGoerliJsonFile(keys);
})();