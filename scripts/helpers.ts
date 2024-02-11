import 'dotenv/config'
import {
    Coin,
    Coins,
    isTxError,
    LCDClient,
    LocalTerra,
    MnemonicKey,
    Msg,
    MsgExecuteContract,
    MsgInstantiateContract,
    MsgMigrateContract,
    MsgStoreCode,
    MsgUpdateContractAdmin,
    Tx,
    Wallet
} from '@terra-money/terra.js';
import {
    readFileSync,
    writeFileSync,
} from 'fs'
import path from 'path'
import { CustomError } from 'ts-custom-error'

import { APIParams } from "@terra-money/terra.js/dist/client/lcd/APIRequester";
import fs from "fs";
import https from "https";

export const ARTIFACTS_PATH = '../artifacts'

export function getRemoteFile(file: any, url: any) {
    let localFile = fs.createWriteStream(path.join(ARTIFACTS_PATH, `${file}.json`));

    https.get(url, (res) => {
        res.pipe(localFile);
        res.on("finish", () => {
            file.close();
        })
    }).on('error', (e) => {
        console.error(e);
    });
}

export function readArtifact(name: string = 'artifact', from: string = ARTIFACTS_PATH) {
    try {
        const data = readFileSync(path.join(from, `${name}.json`), 'utf8')
        return JSON.parse(data)
    } catch (e) {
        return {}
    }
}

export interface Client {
    wallet: Wallet
    furya: LCDClient | LocalTerra
}

export function newClient(): Client {
    const client = <Client>{}
    if (process.env.WALLET) {
        client.furya = new LCDClient({
            URL: String(process.env.LCD_CLIENT_URL),
            chainID: String(process.env.CHAIN_ID)
        })
        client.wallet = recover(client.furya, process.env.WALLET)
    } else {
        client.furya = new LocalTerra()
        client.wallet = (client.furya as LocalTerra).wallets.test1
    }
    return client
}

export function writeArtifact(data: object, name: string = 'artifact', to: string = ARTIFACTS_PATH) {
    writeFileSync(path.join(to, `${name}.json`), JSON.stringify(data, null, 2))
}

let TIMEOUT = 1000

export function setTimeoutDuration(t: number) {
    TIMEOUT = t
}

export function getTimeoutDuration() {
    return TIMEOUT
}

export async function sleep(timeout: number) {
    await new Promise(resolve => setTimeout(resolve, timeout))
}

export class TransactionError extends CustomError {
    public constructor(
        public code: string | number,
        public txhash: string | undefined,
        public rawLog: string,
    ) {
        super("transaction failed")
    }
}

export async function createTransaction(wallet: Wallet, msg: Msg) {
    return await wallet.createAndSignTx({ msgs: [msg] })
}

export async function broadcastTransaction(furya: LCDClient, signedTx: Tx) {
    const result = await furya.tx.broadcast(signedTx)
    await sleep(TIMEOUT)
    return result
}

export async function performTransaction(furya: LCDClient, wallet: Wallet, msg: Msg) {
    const signedTx = await createTransaction(wallet, msg)
    const result = await broadcastTransaction(furya, signedTx)
    if (isTxError(result)) {
        throw new TransactionError(result.code, result.codespace, result.raw_log)
    }
    return result
}

export async function uploadContract(furya: LCDClient, wallet: Wallet, filepath: string) {
    const contract = readFileSync(filepath, 'base64');
    const uploadMsg = new MsgStoreCode(wallet.key.accAddress, contract);
    let result = await performTransaction(furya, wallet, uploadMsg);
    return Number(result.logs[0].eventsByType.store_code.code_id[0]) // code_id
}

export async function instantiateContract(furya: LCDClient, wallet: Wallet, admin_address: string | undefined, codeId: number, msg: object, label: string) {
    const instantiateMsg = new MsgInstantiateContract(wallet.key.accAddress, admin_address, codeId, msg, undefined, label);
    let result = await performTransaction(furya, wallet, instantiateMsg)
    return result.logs[0].events.filter(el => el.type == 'instantiate').map(x => x.attributes.filter(element => element.key == '_contract_address').map(x => x.value));
}

export async function executeContract(furya: LCDClient, wallet: Wallet, contractAddress: string, msg: object, coins?: Coins.Input) {
    const executeMsg = new MsgExecuteContract(wallet.key.accAddress, contractAddress, msg, coins);
    return await performTransaction(furya, wallet, executeMsg);
}

export async function queryContract(furya: LCDClient, contractAddress: string, query: object): Promise<any> {
    return await furya.wasm.contractQuery(contractAddress, query)
}

export async function queryContractInfo(furya: LCDClient, contractAddress: string): Promise<any> {
    return await furya.wasm.contractInfo(contractAddress)
}

export async function queryCodeInfo(furya: LCDClient, codeID: number): Promise<any> {
    return await furya.wasm.codeInfo(codeID)
}

export async function queryContractRaw(furya: LCDClient, end_point: string, params?: APIParams): Promise<any> {
    return await furya.apiRequester.getRaw(end_point, params)
}

export async function deployContract(furya: LCDClient, wallet: Wallet, admin_address: string, filepath: string, initMsg: object, label: string) {
    const codeId = await uploadContract(furya, wallet, filepath);
    return await instantiateContract(furya, wallet, admin_address, codeId, initMsg, label);
}

export async function migrate(furya: LCDClient, wallet: Wallet, contractAddress: string, newCodeId: number, msg: object) {
    const migrateMsg = new MsgMigrateContract(wallet.key.accAddress, contractAddress, newCodeId, msg);
    return await performTransaction(furya, wallet, migrateMsg);
}

export function recover(furya: LCDClient, mnemonic: string) {
    const mk = new MnemonicKey({ mnemonic: mnemonic });
    return furya.wallet(mk);
}

export function initialize(furya: LCDClient) {
    const mk = new MnemonicKey();

    console.log(`Account Address: ${mk.accAddress}`);
    console.log(`MnemonicKey: ${mk.mnemonic}`);

    return furya.wallet(mk);
}

export function toEncodedBinary(object: any) {
    return Buffer.from(JSON.stringify(object)).toString('base64');
}

export function strToEncodedBinary(data: string) {
    return Buffer.from(data).toString('base64');
}

export function toDecodedBinary(data: string) {
    return Buffer.from(data, 'base64')
}

export class NativeAsset {
    denom: string;
    amount?: string

    constructor(denom: string, amount?: string) {
        this.denom = denom
        this.amount = amount
    }

    getInfo() {
        return {
            "native_token": {
                "denom": this.denom,
            }
        }
    }

    withAmount() {
        return {
            "info": this.getInfo(),
            "amount": this.amount
        }
    }

    getDenom() {
        return this.denom
    }

    toCoin() {
        return new Coin(this.denom, this.amount || "0")
    }
}

export class TokenAsset {
    addr: string;
    amount?: string

    constructor(addr: string, amount?: string) {
        this.addr = addr
        this.amount = amount
    }

    getInfo() {
        return {
            "token": {
                "contract_addr": this.addr
            }
        }
    }

    withAmount() {
        return {
            "info": this.getInfo(),
            "amount": this.amount
        }
    }

    toCoin() {
        return null
    }

    getDenom() {
        return this.addr
    }
}

export class NativeSwap {
    offer_denom: string;
    ask_denom: string;

    constructor(offer_denom: string, ask_denom: string) {
        this.offer_denom = offer_denom
        this.ask_denom = ask_denom
    }

    getInfo() {
        return {
            "native_swap": {
                "offer_denom": this.offer_denom,
                "ask_denom": this.ask_denom
            }
        }
    }
}

export class AstroSwap {
    offer_asset_info: TokenAsset | NativeAsset;
    ask_asset_info: TokenAsset | NativeAsset;

    constructor(offer_asset_info: TokenAsset | NativeAsset, ask_asset_info: TokenAsset | NativeAsset) {
        this.offer_asset_info = offer_asset_info
        this.ask_asset_info = ask_asset_info
    }

    getInfo() {
        return {
            "astro_swap": {
                "offer_asset_info": this.offer_asset_info.getInfo(),
                "ask_asset_info": this.ask_asset_info.getInfo(),
            }
        }
    }
}

export function checkParams(network: any, required_params: any) {
    for (const k in required_params) {
        if (!network[required_params[k]]) {
            throw "Set required param: " + required_params[k]
        }
    }
}
